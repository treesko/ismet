import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Minimal seed with one client and one unit
  const client = await prisma.client.create({
    data: {
      fullName: 'Shembull Klienti',
      residence: 'Prishtinë',
      phone: '044-000-000',
      email: 'shembull@example.com'
    }
  })

  const unit = await prisma.unit.create({
    data: {
      block: '7A',
      listNumber: 1,
      floor: 1,
      apartmentNumber: '1',
      areaM2: 75.5,
      pricePerM2: 950,
      totalPrice: 71725,
      saleDate: new Date(),
      contractInfo: 'Kontrata #001',
      comments: 'Shembull i të dhënave',
      type: 'APARTMENT',
      clientId: client.id,
    }
  })

  await prisma.payment.create({
    data: {
      unitId: unit.id,
      clientId: client.id,
      label: 'Pjesa I',
      date: new Date(),
      amount: 10000,
    }
  })

  // Recalculate totals for the unit
  const payments = await prisma.payment.findMany({ where: { unitId: unit.id } })
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const remaining = Math.max((unit.totalPrice || 0) - totalPaid, 0)
  const progress = unit.totalPrice ? (totalPaid / unit.totalPrice) * 100 : 0

  await prisma.unit.update({
    where: { id: unit.id },
    data: { totalPaid, remainingDebt: remaining, paymentProgress: Math.round(progress * 100) / 100 }
  })

  console.log('Seed completed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
