ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'confirmed';
--> statement-breakpoint
-- Fold retired status values into the simplified five-step flow.
UPDATE "orders" SET "status" = 'confirmed' WHERE "status" = 'pending_payment';
--> statement-breakpoint
UPDATE "orders" SET "status" = 'out_for_delivery' WHERE "status" = 'ready';
--> statement-breakpoint
UPDATE "orders" SET "payment_status" = 'unpaid' WHERE "payment_status" IN ('awaiting_verification', 'failed');
