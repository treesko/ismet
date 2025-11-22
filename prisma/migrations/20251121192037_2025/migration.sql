-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "residence" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "block" TEXT NOT NULL,
    "listNumber" INTEGER,
    "floor" INTEGER,
    "apartmentNumber" TEXT,
    "areaM2" REAL,
    "pricePerM2" REAL,
    "totalPrice" REAL,
    "saleDate" DATETIME,
    "contractInfo" TEXT,
    "totalPaid" REAL DEFAULT 0,
    "remainingDebt" REAL DEFAULT 0,
    "paymentProgress" REAL DEFAULT 0,
    "comments" TEXT,
    "type" TEXT NOT NULL DEFAULT 'APARTMENT',
    "clientId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Unit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unitId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "label" TEXT,
    "date" DATETIME,
    "amount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    "issueDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "totalPaidOnInvoice" REAL NOT NULL DEFAULT 0,
    "remainingOnInvoice" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Client_fullName_idx" ON "Client"("fullName");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- CreateIndex
CREATE INDEX "Unit_block_idx" ON "Unit"("block");

-- CreateIndex
CREATE INDEX "Unit_type_idx" ON "Unit"("type");

-- CreateIndex
CREATE INDEX "Unit_clientId_idx" ON "Unit"("clientId");

-- CreateIndex
CREATE INDEX "Unit_floor_idx" ON "Unit"("floor");

-- CreateIndex
CREATE INDEX "Payment_unitId_idx" ON "Payment"("unitId");

-- CreateIndex
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "Invoice_unitId_idx" ON "Invoice"("unitId");
