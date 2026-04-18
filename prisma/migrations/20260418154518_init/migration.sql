-- CreateTable
CREATE TABLE "visits" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT NOT NULL DEFAULT '',
    "ip" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cached_bills" (
    "id" SERIAL NOT NULL,
    "bill_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cached_donors" (
    "id" SERIAL NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cached_donors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visits_created_at_idx" ON "visits"("created_at");

-- CreateIndex
CREATE INDEX "visits_country_idx" ON "visits"("country");

-- CreateIndex
CREATE UNIQUE INDEX "cached_bills_bill_id_key" ON "cached_bills"("bill_id");

-- CreateIndex
CREATE INDEX "cached_bills_bill_id_idx" ON "cached_bills"("bill_id");

-- CreateIndex
CREATE INDEX "cached_bills_expires_at_idx" ON "cached_bills"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "cached_donors_candidate_id_key" ON "cached_donors"("candidate_id");

-- CreateIndex
CREATE INDEX "cached_donors_candidate_id_idx" ON "cached_donors"("candidate_id");

-- CreateIndex
CREATE INDEX "cached_donors_expires_at_idx" ON "cached_donors"("expires_at");
