CREATE TYPE "public"."client_type" AS ENUM('PARTICULIER', 'PROFESSIONNEL');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'PAID', 'PARTIALLY_SHIPPED', 'SHIPPED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CB', 'VIREMENT', 'CHEQUE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CUSTOMER_B2C', 'CUSTOMER_B2B', 'ADMIN', 'COMMERCIAL');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"parent_id" uuid
);
--> statement-breakpoint
CREATE TABLE "commercials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	CONSTRAINT "commercials_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_ref" varchar(50) NOT NULL,
	"type" "client_type" NOT NULL,
	"company_name" varchar(100),
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"coefficient" numeric(4, 2) NOT NULL,
	"commercial_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_customer_ref_unique" UNIQUE("customer_ref"),
	CONSTRAINT "customers_email_unique" UNIQUE("email"),
	CONSTRAINT "check_positive_coefficient" CHECK ("customers"."coefficient" > 0)
);
--> statement-breakpoint
CREATE TABLE "delivery_note_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_note_id" uuid NOT NULL,
	"order_detail_id" uuid NOT NULL,
	"quantity_shipped" integer NOT NULL,
	CONSTRAINT "check_positive_shipped_qty" CHECK ("delivery_note_details"."quantity_shipped" > 0)
);
--> statement-breakpoint
CREATE TABLE "delivery_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"shipped_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"invoice_date" timestamp DEFAULT now() NOT NULL,
	"total_ht" numeric(10, 2) NOT NULL,
	"total_ttc" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method",
	"payment_info" jsonb,
	"is_paid" boolean DEFAULT false NOT NULL,
	CONSTRAINT "check_positive_totals" CHECK ("invoices"."total_ht" >= 0 AND "invoices"."total_ttc" >= "invoices"."total_ht")
);
--> statement-breakpoint
CREATE TABLE "order_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_buy_ht" numeric(10, 2) NOT NULL,
	"unit_price_sell_ht" numeric(10, 2) NOT NULL,
	"vat_rate_applied" numeric(4, 2) NOT NULL,
	CONSTRAINT "check_positive_quantity" CHECK ("order_details"."quantity" > 0),
	CONSTRAINT "check_positive_price_buy_ht" CHECK ("order_details"."unit_price_buy_ht" > 0),
	CONSTRAINT "check_positive_price_sell_ht" CHECK ("order_details"."unit_price_sell_ht" > 0),
	CONSTRAINT "check_valid_vat_rate_applied" CHECK ("order_details"."vat_rate_applied" >= 0 AND "order_details"."vat_rate_applied" <= 100)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"discount_b2b" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"delivery_address" jsonb NOT NULL,
	"billing_address" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	CONSTRAINT "check_valid_discount" CHECK ("orders"."discount_b2b" >= 0 AND "orders"."discount_b2b" <= 100)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label_short" varchar(100) NOT NULL,
	"label_long" text NOT NULL,
	"provider_ref" varchar(100) NOT NULL,
	"price_buy_ht" numeric(10, 2) NOT NULL,
	"vat_rate" numeric(4, 2) DEFAULT '20.00' NOT NULL,
	"photo_url" varchar(255),
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"category_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "check_non_negative_stock" CHECK ("products"."stock_quantity" >= 0),
	CONSTRAINT "check_positive_price_buy" CHECK ("products"."price_buy_ht" > 0),
	CONSTRAINT "check_valid_vat_rate" CHECK ("products"."vat_rate" >= 0 AND "products"."vat_rate" <= 100)
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"ref_provider" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "providers_ref_provider_unique" UNIQUE("ref_provider")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'CUSTOMER_B2C' NOT NULL,
	"customer_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "fk_categories_parent" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_commercial_id_commercials_id_fk" FOREIGN KEY ("commercial_id") REFERENCES "public"."commercials"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_note_details" ADD CONSTRAINT "delivery_note_details_delivery_note_id_delivery_notes_id_fk" FOREIGN KEY ("delivery_note_id") REFERENCES "public"."delivery_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_note_details" ADD CONSTRAINT "delivery_note_details_order_detail_id_order_details_id_fk" FOREIGN KEY ("order_detail_id") REFERENCES "public"."order_details"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_notes" ADD CONSTRAINT "delivery_notes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_categories_parent" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_customers_commercial" ON "customers" USING btree ("commercial_id");--> statement-breakpoint
CREATE INDEX "idx_customers_type" ON "customers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_dn_details_note" ON "delivery_note_details" USING btree ("delivery_note_id");--> statement-breakpoint
CREATE INDEX "idx_dn_details_line" ON "delivery_note_details" USING btree ("order_detail_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_notes_order" ON "delivery_notes" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invoices_order_unique" ON "invoices" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_details_order" ON "order_details" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_details_product" ON "order_details" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_metrics" ON "orders" USING btree ("created_at","status");--> statement-breakpoint
CREATE INDEX "idx_orders_archive" ON "orders" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_provider" ON "products" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_products_lookup" ON "products" USING btree ("is_active","stock_quantity");--> statement-breakpoint
CREATE INDEX "idx_products_search" ON "products" USING btree ("label_short");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_customer" ON "user" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");