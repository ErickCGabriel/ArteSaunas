ALTER TABLE "budgets" ADD COLUMN "requester_name" text;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "requester_phone" text;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "address_street" text;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "address_number" text;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "address_neighborhood" text;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "address_city" text;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "address_state" text;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "room_length" real;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "room_width" real;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "room_height" real;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "has_glass_and_stones" boolean;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "technical_specs" text;