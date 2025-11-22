"use server"
import { prisma } from '@/lib/prisma'
import { allocationSchema, blockDeleteSchema, blockSchema, clientSchema, clientUpdateSchema, invoiceSchema, invoiceUpdateSchema, paymentSchema, paymentUpdateSchema, settingsSchema, unitCreateSchema, unitFullUpdateSchema, unitUpdateSchema } from '@/lib/validators'
import { revalidatePath } from 'next/cache'
import { importWorkbook } from './excel'
import { redirect } from 'next/navigation'

async function recalcUnitTotals(unitId: number) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } })
  if (!unit) return
  const payments = await prisma.payment.findMany({ where: { unitId } })
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const remaining = Math.max((unit.totalPrice || 0) - totalPaid, 0)
  const progress = unit.totalPrice ? (totalPaid / (unit.totalPrice || 1)) * 100 : 0
  await prisma.unit.update({ where: { id: unitId }, data: { totalPaid, remainingDebt: remaining, paymentProgress: Math.round(progress * 100) / 100 } })
}

async function recalcInvoicesForUnit(unitId: number) {
  // Allocate payments honoring explicit allocations first, then FIFO
  const [payments, invoices, allocations] = await Promise.all([
    prisma.payment.findMany({ where: { unitId }, orderBy: [{ date: 'asc' }, { id: 'asc' }] }),
    prisma.invoice.findMany({ where: { unitId }, orderBy: [{ issueDate: 'asc' }, { id: 'asc' }] }),
    prisma.paymentAllocation.findMany({ where: { payment: { unitId } } })
  ])
  const totalPayments = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const explicitPaidByInvoice = new Map<number, number>()
  let totalExplicit = 0
  for (const a of allocations) {
    explicitPaidByInvoice.set(a.invoiceId, (explicitPaidByInvoice.get(a.invoiceId) || 0) + (a.amount || 0))
    totalExplicit += a.amount || 0
  }
  let pool = Math.max(totalPayments - totalExplicit, 0)
  for (const inv of invoices) {
    const already = explicitPaidByInvoice.get(inv.id) || 0
    const need = Math.max((inv.subtotal || 0) - already, 0)
    const fifo = Math.min(pool, need)
    const paidTotal = already + fifo
    const remaining = Math.max((inv.subtotal || 0) - paidTotal, 0)
    await prisma.invoice.update({ where: { id: inv.id }, data: { totalPaidOnInvoice: paidTotal, remainingOnInvoice: remaining } })
    pool -= fifo
  }
}

export async function addPayment(formData: FormData) {
  const data = {
    unitId: Number(formData.get('unitId')),
    clientId: Number(formData.get('clientId')),
    label: String(formData.get('label') || ''),
    date: formData.get('date') ? new Date(String(formData.get('date'))) : undefined,
    amount: Number(formData.get('amount')),
  }
  const parsed = paymentSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  const p = await prisma.payment.create({ data: parsed.data })
  // recalc unit totals
  const payments = await prisma.payment.findMany({ where: { unitId: p.unitId } })
  const unit = await prisma.unit.findUnique({ where: { id: p.unitId } })
  const totalPaid = payments.reduce((s, r) => s + (r.amount || 0), 0)
  const remaining = Math.max((unit?.totalPrice || 0) - totalPaid, 0)
  const progress = unit?.totalPrice ? (totalPaid / (unit?.totalPrice || 1)) * 100 : 0
  await prisma.unit.update({ where: { id: p.unitId }, data: { totalPaid, remainingDebt: remaining, paymentProgress: Math.round(progress * 100) / 100 } })
  await recalcInvoicesForUnit(p.unitId)
  revalidatePath(`/units/${p.unitId}`)
  revalidatePath('/units')
  revalidatePath('/invoices')
  revalidatePath('/clients')
  return { ok: true }
}

export async function updatePayment(formData: FormData) {
  const data = {
    id: Number(formData.get('id')),
    unitId: Number(formData.get('unitId')),
    clientId: Number(formData.get('clientId')),
    label: String(formData.get('label') || ''),
    date: formData.get('date') ? new Date(String(formData.get('date'))) : undefined,
    amount: Number(formData.get('amount')),
  }
  const parsed = paymentUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  await prisma.payment.update({ where: { id: parsed.data.id }, data: parsed.data })
  await recalcUnitTotals(parsed.data.unitId)
  await recalcInvoicesForUnit(parsed.data.unitId)
  revalidatePath(`/units/${parsed.data.unitId}`)
  revalidatePath('/invoices')
  revalidatePath('/clients')
  return { ok: true }
}

export async function deletePayment(formData: FormData) {
  const id = Number(formData.get('id'))
  const unitId = Number(formData.get('unitId'))
  await prisma.payment.delete({ where: { id } })
  await recalcUnitTotals(unitId)
  await recalcInvoicesForUnit(unitId)
  revalidatePath(`/units/${unitId}`)
  revalidatePath('/invoices')
  revalidatePath('/clients')
  return { ok: true }
}

export async function updateUnit(formData: FormData) {
  const data = {
    id: Number(formData.get('id')),
    pricePerM2: formData.get('pricePerM2') ? Number(formData.get('pricePerM2')) : undefined,
    totalPrice: formData.get('totalPrice') ? Number(formData.get('totalPrice')) : undefined,
    comments: formData.get('comments') ? String(formData.get('comments')) : undefined,
  }
  const parsed = unitUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  await prisma.unit.update({ where: { id: parsed.data.id }, data: parsed.data })
  revalidatePath(`/units/${parsed.data.id}`)
  revalidatePath('/units')
  return { ok: true }
}

export async function createUnit(formData: FormData) {
  const data = {
    block: String(formData.get('block')) as '7A' | '7B',
    listNumber: formData.get('listNumber'),
    floor: formData.get('floor'),
    apartmentNumber: String(formData.get('apartmentNumber') || ''),
    areaM2: formData.get('areaM2'),
    pricePerM2: formData.get('pricePerM2'),
    totalPrice: formData.get('totalPrice'),
    saleDate: formData.get('saleDate'),
    contractInfo: String(formData.get('contractInfo') || ''),
    comments: String(formData.get('comments') || ''),
    clientId: formData.get('clientId'),
    type: String(formData.get('type') || 'APARTMENT') as 'APARTMENT' | 'LOCAL',
  }
  const parsed = unitCreateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  const u = await prisma.unit.create({ data: parsed.data as any })
  // initialize totals
  const totalPrice = parsed.data.totalPrice || 0
  await prisma.unit.update({ where: { id: u.id }, data: { totalPaid: 0, remainingDebt: totalPrice, paymentProgress: 0 } })
  redirect(`/units/${u.id}?success=created`)
}

export async function updateUnitFull(formData: FormData) {
  const data = {
    id: Number(formData.get('id')),
    block: String(formData.get('block')) as '7A' | '7B',
    listNumber: formData.get('listNumber'),
    floor: formData.get('floor'),
    apartmentNumber: String(formData.get('apartmentNumber') || ''),
    areaM2: formData.get('areaM2'),
    pricePerM2: formData.get('pricePerM2'),
    totalPrice: formData.get('totalPrice'),
    saleDate: formData.get('saleDate'),
    contractInfo: String(formData.get('contractInfo') || ''),
    comments: String(formData.get('comments') || ''),
    clientId: formData.get('clientId'),
    type: String(formData.get('type') || 'APARTMENT') as 'APARTMENT' | 'LOCAL',
  }
  const parsed = unitFullUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  await prisma.unit.update({ where: { id: parsed.data.id }, data: parsed.data as any })
  await recalcUnitTotals(parsed.data.id)
  redirect(`/units/${parsed.data.id}?success=updated`)
}

// Blocks management
export async function createBlock(formData: FormData) {
  const data = { name: String(formData.get('name') || '').trim() }
  const parsed = blockSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  try {
    await prisma.block.create({ data: parsed.data })
  } catch (e: any) {
    // If unique violation, ignore and continue
  }
  revalidatePath('/blocks')
  revalidatePath('/units')
  revalidatePath('/')
  return { ok: true }
}

export async function deleteBlockAction(formData: FormData) {
  const data = { name: String(formData.get('name') || '').trim() }
  const parsed = blockDeleteSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  const usage = await prisma.unit.count({ where: { block: parsed.data.name } })
  if (usage > 0) {
    redirect(`/blocks?error=${encodeURIComponent('Cannot delete block in use by units')}`)
  }
  try {
    await prisma.block.delete({ where: { name: parsed.data.name } })
  } catch {}
  revalidatePath('/blocks')
  return { ok: true }
}

export async function deleteUnitAction(formData: FormData) {
  const id = Number(formData.get('id'))
  const payments = await prisma.payment.count({ where: { unitId: id } })
  const invoices = await prisma.invoice.count({ where: { unitId: id } })
  if (payments > 0 || invoices > 0) {
    redirect(`/units/${id}?error=Cannot%20delete%20unit%20with%20payments%20or%20invoices`)
  }
  await prisma.unit.delete({ where: { id } })
  redirect(`/units?success=deleted`)
}

export async function upsertClientAction(formData: FormData) {
  const data = {
    fullName: String(formData.get('fullName') || ''),
    residence: String(formData.get('residence') || ''),
    phone: String(formData.get('phone') || ''),
    email: String(formData.get('email') || ''),
  }
  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  const existing = await prisma.client.findFirst({ where: { fullName: parsed.data.fullName, phone: parsed.data.phone || undefined } })
  if (existing) {
    await prisma.client.update({ where: { id: existing.id }, data: parsed.data })
    revalidatePath(`/clients/${existing.id}`)
    return { ok: true, id: existing.id }
  }
  const created = await prisma.client.create({ data: parsed.data })
  revalidatePath(`/clients/${created.id}`)
  return { ok: true, id: created.id }
}

export async function createClient(formData: FormData) {
  const data = {
    fullName: String(formData.get('fullName') || ''),
    residence: String(formData.get('residence') || ''),
    phone: String(formData.get('phone') || ''),
    email: String(formData.get('email') || ''),
  }
  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  const created = await prisma.client.create({ data: parsed.data })
  redirect(`/clients/${created.id}?success=created`)
}

export async function updateClient(formData: FormData) {
  const data = {
    id: Number(formData.get('id')),
    fullName: String(formData.get('fullName') || ''),
    residence: String(formData.get('residence') || ''),
    phone: String(formData.get('phone') || ''),
    email: String(formData.get('email') || ''),
  }
  const parsed = clientUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  await prisma.client.update({ where: { id: parsed.data.id }, data: parsed.data })
  redirect(`/clients/${parsed.data.id}?success=updated`)
}

export async function deleteClientAction(formData: FormData) {
  const id = Number(formData.get('id'))
  const units = await prisma.unit.count({ where: { clientId: id } })
  const invoices = await prisma.invoice.count({ where: { clientId: id } })
  const payments = await prisma.payment.count({ where: { clientId: id } })
  if (units > 0 || invoices > 0 || payments > 0) {
    redirect(`/clients/${id}?error=Cannot%20delete%20client%20with%20existing%20units%20or%20invoices%20or%20payments`)
  }
  await prisma.client.delete({ where: { id } })
  redirect(`/clients?success=deleted`)
}

export async function createInvoice(formData: FormData) {
  const now = new Date()
  const providedInvoiceNumber = String(formData.get('invoiceNumber') || '')
  let invoiceNumber = providedInvoiceNumber
  if (!invoiceNumber) {
    // Use settings invoiceNumberFormat if present (default YYYYMM-####)
    const s = await prisma.settings.findUnique({ where: { id: 1 } })
    const fmt = s?.invoiceNumberFormat || 'YYYYMM-####'
    function applyDateTokens(template: string) {
      return template
        .replace(/YYYY/g, String(now.getFullYear()))
        .replace(/MM/g, String(now.getMonth() + 1).padStart(2, '0'))
        .replace(/DD/g, String(now.getDate()).padStart(2, '0'))
    }
    const applied = applyDateTokens(fmt)
    const m = applied.match(/#+/)
    const width = m ? m[0].length : 4
    const idx = m?.index ?? applied.length
    const prefix = applied.slice(0, idx)
    const suffix = m ? applied.slice(idx + width) : ''
    const existing = await prisma.invoice.findMany({ where: { invoiceNumber: { startsWith: prefix } }, select: { invoiceNumber: true } })
    let maxSeq = 0
    for (const x of existing) {
      if (!x.invoiceNumber.startsWith(prefix)) continue
      if (suffix && !x.invoiceNumber.endsWith(suffix)) continue
      const middle = x.invoiceNumber.slice(prefix.length, x.invoiceNumber.length - suffix.length)
      const n = parseInt(middle, 10)
      if (!isNaN(n)) maxSeq = Math.max(maxSeq, n)
    }
    invoiceNumber = `${prefix}${String(maxSeq + 1).padStart(width, '0')}${suffix}`
  }

  const data = {
    clientId: Number(formData.get('clientId')),
    unitId: Number(formData.get('unitId')),
    issueDate: formData.get('issueDate') ? new Date(String(formData.get('issueDate'))) : new Date(),
    dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : new Date(),
    subtotal: Number(formData.get('subtotal')),
    notes: String(formData.get('notes') || ''),
  }
  const parsed = invoiceSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  // If custom number provided, enforce uniqueness with a friendly error
  if (providedInvoiceNumber) {
    const exists = await prisma.invoice.findUnique({ where: { invoiceNumber } })
    if (exists) {
      redirect(`/invoices/new?error=${encodeURIComponent('Invoice number already exists')}`)
    }
  }
  // Try to create; if a race causes duplicate, bump sequence and retry a few times
  let inv
  for (let i = 0; i < 5; i++) {
    try {
      inv = await prisma.invoice.create({ data: { ...parsed.data, invoiceNumber } })
      break
    } catch (e: any) {
      const message = String(e?.message || '')
      if (message.includes('Unique constraint') || message.includes('Unique constraint failed') || message.includes('UNIQUE constraint failed')) {
        const m = invoiceNumber.match(/^(\d{6})-(\d{4,})$/)
        if (m) {
          const prefix = m[1]
          const seq = parseInt(m[2], 10)
          invoiceNumber = `${prefix}-${String(seq + 1).padStart(4, '0')}`
          continue
        }
      }
      throw e
    }
  }
  if (!inv) throw new Error('Failed to create invoice')
  await recalcInvoicesForUnit(inv.unitId)
  revalidatePath('/invoices')
  redirect(`/invoices/${inv.id}?success=created`)
}

export async function updateInvoice(formData: FormData) {
  const data = {
    id: Number(formData.get('id')),
    invoiceNumber: String(formData.get('invoiceNumber') || ''),
    clientId: Number(formData.get('clientId')),
    unitId: Number(formData.get('unitId')),
    issueDate: formData.get('issueDate') ? new Date(String(formData.get('issueDate'))) : new Date(),
    dueDate: formData.get('dueDate') ? new Date(String(formData.get('dueDate'))) : new Date(),
    subtotal: Number(formData.get('subtotal')),
    notes: String(formData.get('notes') || ''),
  }
  const parsed = invoiceUpdateSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  const { id, ...rest } = parsed.data
  // Enforce unique invoiceNumber on update
  if (rest.invoiceNumber) {
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: rest.invoiceNumber } })
    if (existing && existing.id !== id) {
      redirect(`/invoices/${id}?error=${encodeURIComponent('Invoice number already exists')}`)
    }
  }
  const before = await prisma.invoice.findUnique({ where: { id }, select: { unitId: true } })
  await prisma.invoice.update({ where: { id }, data: rest })
  // Recalc allocations for affected unit(s)
  if (before && before.unitId !== rest.unitId) {
    await recalcInvoicesForUnit(before.unitId)
  }
  await recalcInvoicesForUnit(rest.unitId)
  revalidatePath('/invoices')
  redirect(`/invoices/${id}?success=updated`)
}

export async function deleteInvoiceAction(formData: FormData) {
  const id = Number(formData.get('id'))
  const inv = await prisma.invoice.findUnique({ where: { id }, select: { unitId: true } })
  await prisma.invoice.delete({ where: { id } })
  if (inv) {
    await recalcInvoicesForUnit(inv.unitId)
  }
  revalidatePath('/invoices')
  redirect(`/invoices?success=deleted`)
}

// Settings
export async function saveSettings(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k)
    if (v == null) return undefined
    const s = String(v).trim()
    return s === '' ? undefined : s
  }
  const data = {
    companyName: get('companyName'),
    address1: get('address1'),
    address2: get('address2'),
    city: get('city'),
    country: get('country'),
    email: get('email'),
    phone: get('phone'),
    taxId: get('taxId'),
    logoUrl: get('logoUrl'),
    currencyCode: (get('currencyCode') || 'EUR')?.toUpperCase(),
    locale: get('locale') || 'de-DE',
    invoiceNumberFormat: get('invoiceNumberFormat') || 'YYYYMM-####',
    dateFormat: get('dateFormat') || 'dd/MM/yyyy',
  }
  const parsed = settingsSchema.safeParse(data as any)
  if (!parsed.success) {
    const msg = 'Invalid settings: ' + Object.values(parsed.error.flatten().fieldErrors).flat().join(', ')
    redirect(`/settings?error=${encodeURIComponent(msg)}`)
  }
  await prisma.settings.upsert({ where: { id: 1 }, create: { id: 1, ...parsed.data }, update: parsed.data })
  revalidatePath('/settings')
  revalidatePath('/invoices')
  revalidatePath('/')
  redirect('/settings?success=saved')
}

// Payment allocations
export async function addAllocation(formData: FormData) {
  const data = {
    paymentId: Number(formData.get('paymentId')),
    invoiceId: Number(formData.get('invoiceId')),
    amount: Number(formData.get('amount')),
  }
  const parsed = allocationSchema.safeParse(data)
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() }
  const payment = await prisma.payment.findUnique({ where: { id: parsed.data.paymentId } })
  const invoice = await prisma.invoice.findUnique({ where: { id: parsed.data.invoiceId } })
  if (!payment || !invoice) return { ok: false, error: 'Invalid payment or invoice' }
  // Check available on payment
  const allocatedSum = await prisma.paymentAllocation.aggregate({ _sum: { amount: true }, where: { paymentId: payment.id } })
  const available = (payment.amount || 0) - (allocatedSum._sum.amount || 0)
  if (parsed.data.amount > available + 0.000001) {
    redirect(`/invoices/${invoice.id}?error=${encodeURIComponent('Allocation exceeds payment available amount')}`)
  }
  await prisma.paymentAllocation.upsert({
    where: { paymentId_invoiceId: { paymentId: payment.id, invoiceId: invoice.id } },
    create: { paymentId: payment.id, invoiceId: invoice.id, amount: parsed.data.amount },
    update: { amount: parsed.data.amount },
  })
  await recalcInvoicesForUnit(payment.unitId)
  revalidatePath(`/invoices/${invoice.id}`)
  revalidatePath('/invoices')
  return { ok: true }
}

export async function deleteAllocationAction(formData: FormData) {
  const id = Number(formData.get('id'))
  const alloc = await prisma.paymentAllocation.findUnique({ where: { id }, include: { payment: true, invoice: true } })
  if (!alloc) return { ok: false, error: 'Not found' }
  await prisma.paymentAllocation.delete({ where: { id } })
  await recalcInvoicesForUnit(alloc.payment.unitId)
  revalidatePath(`/invoices/${alloc.invoiceId}`)
  revalidatePath('/invoices')
  return { ok: true }
}

export async function importExcelAction(formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file) return { ok: false, error: 'Missing file' }
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const result = await importWorkbook(buffer)
  revalidatePath('/')
  revalidatePath('/units')
  revalidatePath('/clients')
  return { ok: true, result }
}
