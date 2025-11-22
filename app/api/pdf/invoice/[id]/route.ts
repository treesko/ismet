import { prisma } from '@/lib/prisma'
import { currencyWith, formatDateWith } from '@/lib/utils'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const inv = await prisma.invoice.findUnique({ where: { id }, include: { client: true, unit: true } })
  if (!inv) return new Response('Not found', { status: 404 })
  const settings = await prisma.settings.findUnique({ where: { id: 1 } })

  const company = `
    <div style="font-size:24px;font-weight:600;">${settings?.companyName || 'Company Name'}</div>
    ${settings?.address1 ? `<div style=\"color:#6b7280;font-size:12px;\">${settings.address1}</div>` : ''}
    ${(settings?.city || settings?.country) ? `<div style=\"color:#6b7280;font-size:12px;\">${[settings?.city, settings?.country].filter(Boolean).join(', ')}</div>` : ''}
    ${settings?.email ? `<div style=\"color:#6b7280;font-size:12px;\">Email: ${settings.email}</div>` : ''}
    ${settings?.phone ? `<div style=\"color:#6b7280;font-size:12px;\">Phone: ${settings.phone}</div>` : ''}
    ${settings?.taxId ? `<div style=\"color:#6b7280;font-size:12px;\">Tax ID: ${settings.taxId}</div>` : ''}
  `

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${inv.invoiceNumber}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Apple Color Emoji","Segoe UI Emoji";color:#111827;}
    .container{max-width:800px;margin:40px auto;padding:0 16px;}
    .border{border:1px solid #e5e7eb;border-radius:8px;}
    .p{padding:16px;}
    .mt{margin-top:16px;}
    .row{display:flex;justify-content:space-between;align-items:flex-start;}
    .text-right{text-align:right;}
    .muted{color:#6b7280}
    table{width:100%;border-collapse:collapse;font-size:14px}
    th,td{padding:8px;border-bottom:1px solid #e5e7eb}
    th{background:#f9fafb;text-align:left}
  </style>
  </head><body>
    <div class="container">
      <h1 style="font-size:20px;font-weight:600;margin-bottom:8px;">Invoice ${inv.invoiceNumber}</h1>
      <div class="border p">
        <div class="row">
          <div>${company}</div>
          <div class="text-right">
            <div class="muted" style="font-size:12px;">Invoice</div>
            <div style="font-size:18px;font-weight:600;">${inv.invoiceNumber}</div>
            <div style="font-size:12px;">Issue: ${formatDateWith(inv.issueDate, settings || undefined)}</div>
            <div style="font-size:12px;">Due: ${formatDateWith(inv.dueDate, settings || undefined)}</div>
          </div>
        </div>

        <div class="row mt">
          <div class="border p" style="flex:1;margin-right:8px;">
            <div style="font-size:12px;font-weight:600">Bill To</div>
            <div style="font-size:14px;">${inv.client.fullName}</div>
            <div class="muted" style="font-size:12px;">${inv.client.residence || '-'}</div>
            <div class="muted" style="font-size:12px;">${inv.client.phone || '-'}</div>
          </div>
          <div class="border p" style="flex:1;margin-left:8px;">
            <div style="font-size:12px;font-weight:600">Unit</div>
            <div style="font-size:14px;">${inv.unit.block}-${inv.unit.apartmentNumber || inv.unit.listNumber || inv.unitId}</div>
            <div class="muted" style="font-size:12px;">Area ${inv.unit.areaM2 ?? '-'} m² • Price/m² ${currencyWith(inv.unit.pricePerM2, settings || undefined)}</div>
            <div class="muted" style="font-size:12px;">Total unit price ${currencyWith(inv.unit.totalPrice, settings || undefined)}</div>
          </div>
        </div>

        <div class="mt">
          <table>
            <thead><tr><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>
            <tbody>
              <tr><td>Unit ${inv.unit.block}-${inv.unit.apartmentNumber || inv.unit.listNumber || inv.unitId}</td><td style="text-align:right;">${currencyWith(inv.subtotal, settings || undefined)}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="row mt">
          <div></div>
          <div class="border p" style="width:260px;font-size:14px;">
            <div class="row"><span>Subtotal</span><span>${currencyWith(inv.subtotal, settings || undefined)}</span></div>
            <div class="row"><span>Paid on invoice</span><span>${currencyWith(inv.totalPaidOnInvoice, settings || undefined)}</span></div>
            <div class="row" style="font-weight:600;"><span>Remaining</span><span>${currencyWith(inv.remainingOnInvoice, settings || undefined)}</span></div>
          </div>
        </div>
      </div>
    </div>
  </body></html>`

  const serviceUrl = process.env.PDF_SERVICE_URL
  if (!serviceUrl) {
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
  try {
    const res = await fetch(serviceUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html }) })
    if (!res.ok) {
      const text = await res.text()
      return new Response(`PDF service error: ${text}`, { status: 502 })
    }
    const pdf = await res.arrayBuffer()
    return new Response(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=invoice-${inv.invoiceNumber}.pdf` } })
  } catch (e: any) {
    return new Response('PDF service unavailable', { status: 502 })
  }
}

