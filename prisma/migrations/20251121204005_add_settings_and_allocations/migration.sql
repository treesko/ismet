-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paymentId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "companyName" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "country" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "taxId" TEXT,
    "logoUrl" TEXT,
    "currencyCode" TEXT DEFAULT 'EUR',
    "locale" TEXT DEFAULT 'de-DE',
    "invoiceNumberFormat" TEXT DEFAULT 'YYYYMM-####',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoiceId_idx" ON "PaymentAllocation"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_invoiceId_key" ON "PaymentAllocation"("paymentId", "invoiceId");
