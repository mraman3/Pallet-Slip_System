-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postal" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAddress" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "location_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postal" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clerk" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clerk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalletType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PalletType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slip" (
    "id" SERIAL NOT NULL,
    "slip_number" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "ship_to_address_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clerk_id" INTEGER NOT NULL,
    "customer_order" TEXT NOT NULL,
    "date_shipped" TIMESTAMP(3),
    "shipped_via" TEXT NOT NULL,
    "comments_line1" TEXT,
    "comments_line2" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlipItem" (
    "id" SERIAL NOT NULL,
    "slip_id" INTEGER NOT NULL,
    "pallet_type_id" INTEGER NOT NULL,
    "qty_ordered" TEXT NOT NULL,
    "qty_shipped" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlipItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Slip_slip_number_key" ON "Slip"("slip_number");

-- AddForeignKey
ALTER TABLE "ClientAddress" ADD CONSTRAINT "ClientAddress_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slip" ADD CONSTRAINT "Slip_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slip" ADD CONSTRAINT "Slip_ship_to_address_id_fkey" FOREIGN KEY ("ship_to_address_id") REFERENCES "ClientAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slip" ADD CONSTRAINT "Slip_clerk_id_fkey" FOREIGN KEY ("clerk_id") REFERENCES "Clerk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlipItem" ADD CONSTRAINT "SlipItem_slip_id_fkey" FOREIGN KEY ("slip_id") REFERENCES "Slip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlipItem" ADD CONSTRAINT "SlipItem_pallet_type_id_fkey" FOREIGN KEY ("pallet_type_id") REFERENCES "PalletType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
