-- Make customer_order nullable (already applied manually in prod)
ALTER TABLE "Slip"
ALTER COLUMN "customer_order" DROP NOT NULL;
