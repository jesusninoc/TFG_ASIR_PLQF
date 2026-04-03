-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('CPU', 'MOTHERBOARD', 'MEMORY', 'STORAGE', 'GPU', 'PSU', 'CASE');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('DDR4', 'DDR5');

-- CreateEnum
CREATE TYPE "StorageInterface" AS ENUM ('M2_NVME', 'SATA');

-- CreateEnum
CREATE TYPE "FormFactor" AS ENUM ('MINI_ITX', 'MATX', 'ATX', 'E_ATX', 'XL_ATX');

-- CreateEnum
CREATE TYPE "PsuEfficiency" AS ENUM ('BRONZE_80PLUS', 'GOLD_80PLUS', 'PLATINUM_80PLUS');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "priceCents" INTEGER NOT NULL,
    "componentType" "ComponentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CpuSpec" (
    "productId" TEXT NOT NULL,
    "socket" TEXT NOT NULL,
    "cores" INTEGER NOT NULL,
    "threads" INTEGER NOT NULL,
    "tdpWatts" INTEGER NOT NULL,

    CONSTRAINT "CpuSpec_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "MotherboardSpec" (
    "productId" TEXT NOT NULL,
    "socket" TEXT NOT NULL,
    "formFactor" "FormFactor" NOT NULL,
    "memoryType" "MemoryType" NOT NULL,
    "maxMemoryGb" INTEGER NOT NULL,
    "m2Slots" INTEGER NOT NULL,
    "sataPorts" INTEGER NOT NULL,

    CONSTRAINT "MotherboardSpec_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "MemorySpec" (
    "productId" TEXT NOT NULL,
    "memoryType" "MemoryType" NOT NULL,
    "speedMhz" INTEGER NOT NULL,
    "capacityGb" INTEGER NOT NULL,
    "modules" INTEGER NOT NULL,

    CONSTRAINT "MemorySpec_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "StorageSpec" (
    "productId" TEXT NOT NULL,
    "interface" "StorageInterface" NOT NULL,
    "capacityGb" INTEGER NOT NULL,

    CONSTRAINT "StorageSpec_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "GpuSpec" (
    "productId" TEXT NOT NULL,
    "vramGb" INTEGER NOT NULL,
    "tdpWatts" INTEGER NOT NULL,

    CONSTRAINT "GpuSpec_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "PsuSpec" (
    "productId" TEXT NOT NULL,
    "wattage" INTEGER NOT NULL,
    "efficiency" "PsuEfficiency" NOT NULL,

    CONSTRAINT "PsuSpec_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "CaseSpec" (
    "productId" TEXT NOT NULL,
    "supportedFormFactors" "FormFactor"[],

    CONSTRAINT "CaseSpec_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeSessionId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "customerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqEntry" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaqEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

-- AddForeignKey
ALTER TABLE "CpuSpec" ADD CONSTRAINT "CpuSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotherboardSpec" ADD CONSTRAINT "MotherboardSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemorySpec" ADD CONSTRAINT "MemorySpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageSpec" ADD CONSTRAINT "StorageSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpuSpec" ADD CONSTRAINT "GpuSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsuSpec" ADD CONSTRAINT "PsuSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseSpec" ADD CONSTRAINT "CaseSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
