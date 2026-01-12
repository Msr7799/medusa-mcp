# قاعدة البيانات — Schema (PostgreSQL)

هذا الملف يحتوي على تعريفات الـ **Schema** (DDL) كما تم تزويدها.

> ملاحظة: إذا بتشغّلها كـ migration على Postgres/Neon/Supabase، الامتداد القياسي يكون `.sql`.
> هنا حطّيناها في `.md` للتوثيق/المراجعة، مع كتلة كود SQL قابلة للنسخ.

## SQL

```sql
CREATE SCHEMA "public";
CREATE SCHEMA "neon_auth";
CREATE TYPE "order_status_enum" AS ENUM('pending', 'completed', 'draft', 'archived', 'canceled', 'requires_action');
CREATE TYPE "order_claim_type_enum" AS ENUM('refund', 'replace');
CREATE TYPE "claim_reason_enum" AS ENUM('missing_item', 'wrong_item', 'production_failure', 'other');
CREATE TYPE "return_status_enum" AS ENUM('open', 'requested', 'received', 'partially_received', 'canceled');
CREATE TABLE "account_holder" (
    "id" text PRIMARY KEY,
    "provider_id" text NOT NULL,
    "external_id" text NOT NULL,
    "email" text,
    "data" jsonb DEFAULT '{}' NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "api_key" (
    "id" text PRIMARY KEY,
    "token" text NOT NULL,
    "salt" text NOT NULL,
    "redacted" text NOT NULL,
    "title" text NOT NULL,
    "type" text NOT NULL,
    "last_used_at" timestamp with time zone,
    "created_by" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "revoked_by" text,
    "revoked_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "api_key_type_check" CHECK (CHECK ((type = ANY (ARRAY['publishable'::text, 'secret'::text]))))
);
CREATE TABLE "application_method_buy_rules" (
    "application_method_id" text,
    "promotion_rule_id" text,
    CONSTRAINT "application_method_buy_rules_pkey" PRIMARY KEY("application_method_id","promotion_rule_id")
);
CREATE TABLE "application_method_target_rules" (
    "application_method_id" text,
    "promotion_rule_id" text,
    CONSTRAINT "application_method_target_rules_pkey" PRIMARY KEY("application_method_id","promotion_rule_id")
);
CREATE TABLE "auth_identity" (
    "id" text PRIMARY KEY,
    "app_metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "capture" (
    "id" text PRIMARY KEY,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "payment_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_by" text,
    "metadata" jsonb
);
CREATE TABLE "cart" (
    "id" text PRIMARY KEY,
    "region_id" text,
    "customer_id" text,
    "sales_channel_id" text,
    "email" text,
    "currency_code" text NOT NULL,
    "shipping_address_id" text,
    "billing_address_id" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "locale" text
);
CREATE TABLE "cart_address" (
    "id" text PRIMARY KEY,
    "customer_id" text,
    "company" text,
    "first_name" text,
    "last_name" text,
    "address_1" text,
    "address_2" text,
    "city" text,
    "country_code" text,
    "province" text,
    "postal_code" text,
    "phone" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "cart_line_item" (
    "id" text PRIMARY KEY,
    "cart_id" text NOT NULL,
    "title" text NOT NULL,
    "subtitle" text,
    "thumbnail" text,
    "quantity" integer NOT NULL,
    "variant_id" text,
    "product_id" text,
    "product_title" text,
    "product_description" text,
    "product_subtitle" text,
    "product_type" text,
    "product_collection" text,
    "product_handle" text,
    "variant_sku" text,
    "variant_barcode" text,
    "variant_title" text,
    "variant_option_values" jsonb,
    "requires_shipping" boolean DEFAULT true NOT NULL,
    "is_discountable" boolean DEFAULT true NOT NULL,
    "is_tax_inclusive" boolean DEFAULT false NOT NULL,
    "compare_at_unit_price" numeric,
    "raw_compare_at_unit_price" jsonb,
    "unit_price" numeric NOT NULL,
    "raw_unit_price" jsonb NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "product_type_id" text,
    "is_custom_price" boolean DEFAULT false NOT NULL,
    "is_giftcard" boolean DEFAULT false NOT NULL,
    CONSTRAINT "cart_line_item_unit_price_check" CHECK (CHECK ((unit_price >= (0)::numeric)))
);
CREATE TABLE "cart_line_item_adjustment" (
    "id" text PRIMARY KEY,
    "description" text,
    "promotion_id" text,
    "code" text,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "provider_id" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "item_id" text,
    "is_tax_inclusive" boolean DEFAULT false NOT NULL,
    CONSTRAINT "cart_line_item_adjustment_check" CHECK (CHECK ((amount >= (0)::numeric)))
);
CREATE TABLE "cart_line_item_tax_line" (
    "id" text PRIMARY KEY,
    "description" text,
    "tax_rate_id" text,
    "code" text NOT NULL,
    "rate" real NOT NULL,
    "provider_id" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "item_id" text
);
CREATE TABLE "cart_payment_collection" (
    "cart_id" varchar(255),
    "payment_collection_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "cart_payment_collection_pkey" PRIMARY KEY("cart_id","payment_collection_id")
);
CREATE TABLE "cart_promotion" (
    "cart_id" varchar(255),
    "promotion_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "cart_promotion_pkey" PRIMARY KEY("cart_id","promotion_id")
);
CREATE TABLE "cart_shipping_method" (
    "id" text PRIMARY KEY,
    "cart_id" text NOT NULL,
    "name" text NOT NULL,
    "description" jsonb,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "is_tax_inclusive" boolean DEFAULT false NOT NULL,
    "shipping_option_id" text,
    "data" jsonb,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "cart_shipping_method_check" CHECK (CHECK ((amount >= (0)::numeric)))
);
CREATE TABLE "cart_shipping_method_adjustment" (
    "id" text PRIMARY KEY,
    "description" text,
    "promotion_id" text,
    "code" text,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "provider_id" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "shipping_method_id" text
);
CREATE TABLE "cart_shipping_method_tax_line" (
    "id" text PRIMARY KEY,
    "description" text,
    "tax_rate_id" text,
    "code" text NOT NULL,
    "rate" real NOT NULL,
    "provider_id" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "shipping_method_id" text
);
CREATE TABLE "credit_line" (
    "id" text PRIMARY KEY,
    "cart_id" text NOT NULL,
    "reference" text,
    "reference_id" text,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "currency" (
    "code" text PRIMARY KEY,
    "symbol" text NOT NULL,
    "symbol_native" text NOT NULL,
    "decimal_digits" integer DEFAULT 0 NOT NULL,
    "rounding" numeric DEFAULT '0' NOT NULL,
    "raw_rounding" jsonb NOT NULL,
    "name" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "customer" (
    "id" text PRIMARY KEY,
    "company_name" text,
    "first_name" text,
    "last_name" text,
    "email" text,
    "phone" text,
    "has_account" boolean DEFAULT false NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_by" text
);
CREATE TABLE "customer_account_holder" (
    "customer_id" varchar(255),
    "account_holder_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "customer_account_holder_pkey" PRIMARY KEY("customer_id","account_holder_id")
);
CREATE TABLE "customer_address" (
    "id" text PRIMARY KEY,
    "customer_id" text NOT NULL,
    "address_name" text,
    "is_default_shipping" boolean DEFAULT false NOT NULL,
    "is_default_billing" boolean DEFAULT false NOT NULL,
    "company" text,
    "first_name" text,
    "last_name" text,
    "address_1" text,
    "address_2" text,
    "city" text,
    "country_code" text,
    "province" text,
    "postal_code" text,
    "phone" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "customer_group" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "metadata" jsonb,
    "created_by" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "customer_group_customer" (
    "id" text PRIMARY KEY,
    "customer_id" text NOT NULL,
    "customer_group_id" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "created_by" text,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "fulfillment" (
    "id" text PRIMARY KEY,
    "location_id" text NOT NULL,
    "packed_at" timestamp with time zone,
    "shipped_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "data" jsonb,
    "provider_id" text,
    "shipping_option_id" text,
    "metadata" jsonb,
    "delivery_address_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "marked_shipped_by" text,
    "created_by" text,
    "requires_shipping" boolean DEFAULT true NOT NULL
);
CREATE TABLE "fulfillment_address" (
    "id" text PRIMARY KEY,
    "company" text,
    "first_name" text,
    "last_name" text,
    "address_1" text,
    "address_2" text,
    "city" text,
    "country_code" text,
    "province" text,
    "postal_code" text,
    "phone" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "fulfillment_item" (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "sku" text NOT NULL,
    "barcode" text NOT NULL,
    "quantity" numeric NOT NULL,
    "raw_quantity" jsonb NOT NULL,
    "line_item_id" text,
    "inventory_item_id" text,
    "fulfillment_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "fulfillment_label" (
    "id" text PRIMARY KEY,
    "tracking_number" text NOT NULL,
    "tracking_url" text NOT NULL,
    "label_url" text NOT NULL,
    "fulfillment_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "fulfillment_provider" (
    "id" text PRIMARY KEY,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "fulfillment_set" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "type" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "geo_zone" (
    "id" text PRIMARY KEY,
    "type" text DEFAULT 'country' NOT NULL,
    "country_code" text NOT NULL,
    "province_code" text,
    "city" text,
    "service_zone_id" text NOT NULL,
    "postal_expression" jsonb,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "geo_zone_type_check" CHECK (CHECK ((type = ANY (ARRAY['country'::text, 'province'::text, 'city'::text, 'zip'::text]))))
);
CREATE TABLE "image" (
    "id" text PRIMARY KEY,
    "url" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "rank" integer DEFAULT 0 NOT NULL,
    "product_id" text NOT NULL
);
CREATE TABLE "inventory_item" (
    "id" text PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "sku" text,
    "origin_country" text,
    "hs_code" text,
    "mid_code" text,
    "material" text,
    "weight" integer,
    "length" integer,
    "height" integer,
    "width" integer,
    "requires_shipping" boolean DEFAULT true NOT NULL,
    "description" text,
    "title" text,
    "thumbnail" text,
    "metadata" jsonb
);
CREATE TABLE "inventory_level" (
    "id" text PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "inventory_item_id" text NOT NULL,
    "location_id" text NOT NULL,
    "stocked_quantity" numeric DEFAULT '0' NOT NULL,
    "reserved_quantity" numeric DEFAULT '0' NOT NULL,
    "incoming_quantity" numeric DEFAULT '0' NOT NULL,
    "metadata" jsonb,
    "raw_stocked_quantity" jsonb,
    "raw_reserved_quantity" jsonb,
    "raw_incoming_quantity" jsonb
);
CREATE TABLE "invite" (
    "id" text PRIMARY KEY,
    "email" text NOT NULL,
    "accepted" boolean DEFAULT false NOT NULL,
    "token" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "link_module_migrations" (
    "id" serial PRIMARY KEY,
    "table_name" varchar(255) NOT NULL CONSTRAINT "link_module_migrations_table_name_key" UNIQUE,
    "link_descriptor" jsonb DEFAULT '{}' NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "location_fulfillment_provider" (
    "stock_location_id" varchar(255),
    "fulfillment_provider_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "location_fulfillment_provider_pkey" PRIMARY KEY("stock_location_id","fulfillment_provider_id")
);
CREATE TABLE "location_fulfillment_set" (
    "stock_location_id" varchar(255),
    "fulfillment_set_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "location_fulfillment_set_pkey" PRIMARY KEY("stock_location_id","fulfillment_set_id")
);
CREATE TABLE "mikro_orm_migrations" (
    "id" serial PRIMARY KEY,
    "name" varchar(255),
    "executed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "notification" (
    "id" text PRIMARY KEY,
    "to" text NOT NULL,
    "channel" text NOT NULL,
    "template" text,
    "data" jsonb,
    "trigger_type" text,
    "resource_id" text,
    "resource_type" text,
    "receiver_id" text,
    "original_notification_id" text,
    "idempotency_key" text,
    "external_id" text,
    "provider_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "status" text DEFAULT 'pending' NOT NULL,
    "from" text,
    "provider_data" jsonb,
    CONSTRAINT "notification_status_check" CHECK (CHECK ((status = ANY (ARRAY['pending'::text, 'success'::text, 'failure'::text]))))
);
CREATE TABLE "notification_provider" (
    "id" text PRIMARY KEY,
    "handle" text NOT NULL,
    "name" text NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "channels" text[] DEFAULT '{}' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "order" (
    "id" text PRIMARY KEY,
    "region_id" text,
    "display_id" serial,
    "customer_id" text,
    "version" integer DEFAULT 1 NOT NULL,
    "sales_channel_id" text,
    "status" order_status_enum DEFAULT 'pending' NOT NULL,
    "is_draft_order" boolean DEFAULT false NOT NULL,
    "email" text,
    "currency_code" text NOT NULL,
    "shipping_address_id" text,
    "billing_address_id" text,
    "no_notification" boolean,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "custom_display_id" text,
    "locale" text
);
CREATE TABLE "order_address" (
    "id" text PRIMARY KEY,
    "customer_id" text,
    "company" text,
    "first_name" text,
    "last_name" text,
    "address_1" text,
    "address_2" text,
    "city" text,
    "country_code" text,
    "province" text,
    "postal_code" text,
    "phone" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "order_cart" (
    "order_id" varchar(255),
    "cart_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "order_cart_pkey" PRIMARY KEY("order_id","cart_id")
);
CREATE TABLE "order_change" (
    "id" text PRIMARY KEY,
    "order_id" text NOT NULL,
    "version" integer NOT NULL,
    "description" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "internal_note" text,
    "created_by" text,
    "requested_by" text,
    "requested_at" timestamp with time zone,
    "confirmed_by" text,
    "confirmed_at" timestamp with time zone,
    "declined_by" text,
    "declined_reason" text,
    "metadata" jsonb,
    "declined_at" timestamp with time zone,
    "canceled_by" text,
    "canceled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "change_type" text,
    "deleted_at" timestamp with time zone,
    "return_id" text,
    "claim_id" text,
    "exchange_id" text,
    "carry_over_promotions" boolean,
    CONSTRAINT "order_change_status_check" CHECK (CHECK ((status = ANY (ARRAY['confirmed'::text, 'declined'::text, 'requested'::text, 'pending'::text, 'canceled'::text]))))
);
CREATE TABLE "order_change_action" (
    "id" text PRIMARY KEY,
    "order_id" text,
    "version" integer,
    "ordering" bigserial,
    "order_change_id" text,
    "reference" text,
    "reference_id" text,
    "action" text NOT NULL,
    "details" jsonb,
    "amount" numeric,
    "raw_amount" jsonb,
    "internal_note" text,
    "applied" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "return_id" text,
    "claim_id" text,
    "exchange_id" text
);
CREATE TABLE "order_claim" (
    "id" text PRIMARY KEY,
    "order_id" text NOT NULL,
    "return_id" text,
    "order_version" integer NOT NULL,
    "display_id" serial,
    "type" order_claim_type_enum NOT NULL,
    "no_notification" boolean,
    "refund_amount" numeric,
    "raw_refund_amount" jsonb,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "created_by" text
);
CREATE TABLE "order_claim_item" (
    "id" text PRIMARY KEY,
    "claim_id" text NOT NULL,
    "item_id" text NOT NULL,
    "is_additional_item" boolean DEFAULT false NOT NULL,
    "reason" claim_reason_enum,
    "quantity" numeric NOT NULL,
    "raw_quantity" jsonb NOT NULL,
    "note" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "order_claim_item_image" (
    "id" text PRIMARY KEY,
    "claim_item_id" text NOT NULL,
    "url" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "order_credit_line" (
    "id" text PRIMARY KEY,
    "order_id" text NOT NULL,
    "reference" text,
    "reference_id" text,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "version" integer DEFAULT 1 NOT NULL
);
CREATE TABLE "order_exchange" (
    "id" text PRIMARY KEY,
    "order_id" text NOT NULL,
    "return_id" text,
    "order_version" integer NOT NULL,
    "display_id" serial,
    "no_notification" boolean,
    "allow_backorder" boolean DEFAULT false NOT NULL,
    "difference_due" numeric,
    "raw_difference_due" jsonb,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "created_by" text
);
CREATE TABLE "order_exchange_item" (
    "id" text PRIMARY KEY,
    "exchange_id" text NOT NULL,
    "item_id" text NOT NULL,
    "quantity" numeric NOT NULL,
    "raw_quantity" jsonb NOT NULL,
    "note" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "order_fulfillment" (
    "order_id" varchar(255),
    "fulfillment_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "order_fulfillment_pkey" PRIMARY KEY("order_id","fulfillment_id")
);
CREATE TABLE "order_item" (
    "id" text PRIMARY KEY,
    "order_id" text NOT NULL,
    "version" integer NOT NULL,
    "item_id" text NOT NULL,
    "quantity" numeric NOT NULL,
    "raw_quantity" jsonb NOT NULL,
    "fulfilled_quantity" numeric NOT NULL,
    "raw_fulfilled_quantity" jsonb DEFAULT '{"value":"0", "precision": 20}' NOT NULL,
    "shipped_quantity" numeric NOT NULL,
    "raw_shipped_quantity" jsonb DEFAULT '{"value":"0", "precision": 20}' NOT NULL,
    "return_requested_quantity" numeric NOT NULL,
    "raw_return_requested_quantity" jsonb DEFAULT '{"value":"0", "precision": 20}' NOT NULL,
    "return_received_quantity" numeric NOT NULL,
    "raw_return_received_quantity" jsonb DEFAULT '{"value":"0", "precision": 20}' NOT NULL,
    "return_dismissed_quantity" numeric NOT NULL,
    "raw_return_dismissed_quantity" jsonb DEFAULT '{"value":"0", "precision": 20}' NOT NULL,
    "written_off_quantity" numeric NOT NULL,
    "raw_written_off_quantity" jsonb DEFAULT '{"value":"0", "precision": 20}' NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "delivered_quantity" numeric DEFAULT '0' NOT NULL,
    "raw_delivered_quantity" jsonb DEFAULT '{"value":"0", "precision": 20}' NOT NULL,
    "unit_price" numeric,
    "raw_unit_price" jsonb,
    "compare_at_unit_price" numeric,
    "raw_compare_at_unit_price" jsonb
);
CREATE TABLE "order_line_item" (
    "id" text PRIMARY KEY,
    "totals_id" text,
    "title" text NOT NULL,
    "subtitle" text,
    "thumbnail" text,
    "variant_id" text,
    "product_id" text,
    "product_title" text,
    "product_description" text,
    "product_subtitle" text,
    "product_type" text,
    "product_collection" text,
    "product_handle" text,
    "variant_sku" text,
    "variant_barcode" text,
    "variant_title" text,
    "variant_option_values" jsonb,
    "requires_shipping" boolean DEFAULT true NOT NULL,
    "is_discountable" boolean DEFAULT true NOT NULL,
    "is_tax_inclusive" boolean DEFAULT false NOT NULL,
    "compare_at_unit_price" numeric,
    "raw_compare_at_unit_price" jsonb,
    "unit_price" numeric NOT NULL,
    "raw_unit_price" jsonb NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_custom_price" boolean DEFAULT false NOT NULL,
    "product_type_id" text,
    "is_giftcard" boolean DEFAULT false NOT NULL
);
CREATE TABLE "order_line_item_adjustment" (
    "id" text PRIMARY KEY,
    "description" text,
    "promotion_id" text,
    "code" text,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "provider_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "item_id" text NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_tax_inclusive" boolean DEFAULT false NOT NULL,
    "version" integer DEFAULT 1 NOT NULL
);
CREATE TABLE "order_line_item_tax_line" (
    "id" text PRIMARY KEY,
    "description" text,
    "tax_rate_id" text,
    "code" text NOT NULL,
    "rate" numeric NOT NULL,
    "raw_rate" jsonb NOT NULL,
    "provider_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "item_id" text NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "order_payment_collection" (
    "order_id" varchar(255),
    "payment_collection_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "order_payment_collection_pkey" PRIMARY KEY("order_id","payment_collection_id")
);
CREATE TABLE "order_promotion" (
    "order_id" varchar(255),
    "promotion_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "order_promotion_pkey" PRIMARY KEY("order_id","promotion_id")
);
CREATE TABLE "order_shipping" (
    "id" text PRIMARY KEY,
    "order_id" text NOT NULL,
    "version" integer NOT NULL,
    "shipping_method_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "return_id" text,
    "claim_id" text,
    "exchange_id" text
);
CREATE TABLE "order_shipping_method" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "description" jsonb,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "is_tax_inclusive" boolean DEFAULT false NOT NULL,
    "shipping_option_id" text,
    "data" jsonb,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_custom_amount" boolean DEFAULT false NOT NULL
);
CREATE TABLE "order_shipping_method_adjustment" (
    "id" text PRIMARY KEY,
    "description" text,
    "promotion_id" text,
    "code" text,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "provider_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "shipping_method_id" text NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "order_shipping_method_tax_line" (
    "id" text PRIMARY KEY,
    "description" text,
    "tax_rate_id" text,
    "code" text NOT NULL,
    "rate" numeric NOT NULL,
    "raw_rate" jsonb NOT NULL,
    "provider_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "shipping_method_id" text NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "order_summary" (
    "id" text PRIMARY KEY,
    "order_id" text NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "totals" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "order_transaction" (
    "id" text PRIMARY KEY,
    "order_id" text NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "currency_code" text NOT NULL,
    "reference" text,
    "reference_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "return_id" text,
    "claim_id" text,
    "exchange_id" text
);
CREATE TABLE "payment" (
    "id" text PRIMARY KEY,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "currency_code" text NOT NULL,
    "provider_id" text NOT NULL,
    "data" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "captured_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "payment_collection_id" text NOT NULL,
    "payment_session_id" text NOT NULL,
    "metadata" jsonb
);
CREATE TABLE "payment_collection" (
    "id" text PRIMARY KEY,
    "currency_code" text NOT NULL,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "authorized_amount" numeric,
    "raw_authorized_amount" jsonb,
    "captured_amount" numeric,
    "raw_captured_amount" jsonb,
    "refunded_amount" numeric,
    "raw_refunded_amount" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "status" text DEFAULT 'not_paid' NOT NULL,
    "metadata" jsonb,
    CONSTRAINT "payment_collection_status_check" CHECK (CHECK ((status = ANY (ARRAY['not_paid'::text, 'awaiting'::text, 'authorized'::text, 'partially_authorized'::text, 'canceled'::text, 'failed'::text, 'partially_captured'::text, 'completed'::text]))))
);
CREATE TABLE "payment_collection_payment_providers" (
    "payment_collection_id" text,
    "payment_provider_id" text,
    CONSTRAINT "payment_collection_payment_providers_pkey" PRIMARY KEY("payment_collection_id","payment_provider_id")
);
CREATE TABLE "payment_provider" (
    "id" text PRIMARY KEY,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "payment_session" (
    "id" text PRIMARY KEY,
    "currency_code" text NOT NULL,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "provider_id" text NOT NULL,
    "data" jsonb DEFAULT '{}' NOT NULL,
    "context" jsonb,
    "status" text DEFAULT 'pending' NOT NULL,
    "authorized_at" timestamp with time zone,
    "payment_collection_id" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "payment_session_status_check" CHECK (CHECK ((status = ANY (ARRAY['authorized'::text, 'captured'::text, 'pending'::text, 'requires_more'::text, 'error'::text, 'canceled'::text]))))
);
CREATE TABLE "price" (
    "id" text PRIMARY KEY,
    "title" text,
    "price_set_id" text NOT NULL,
    "currency_code" text NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "rules_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "price_list_id" text,
    "amount" numeric NOT NULL,
    "min_quantity" numeric,
    "max_quantity" numeric,
    "raw_min_quantity" jsonb,
    "raw_max_quantity" jsonb
);
CREATE TABLE "price_list" (
    "id" text PRIMARY KEY,
    "status" text DEFAULT 'draft' NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "rules_count" integer DEFAULT 0,
    "title" text NOT NULL,
    "description" text NOT NULL,
    "type" text DEFAULT 'sale' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "price_list_status_check" CHECK (CHECK ((status = ANY (ARRAY['active'::text, 'draft'::text])))),
    CONSTRAINT "price_list_type_check" CHECK (CHECK ((type = ANY (ARRAY['sale'::text, 'override'::text]))))
);
CREATE TABLE "price_list_rule" (
    "id" text PRIMARY KEY,
    "price_list_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "value" jsonb,
    "attribute" text DEFAULT '' NOT NULL
);
CREATE TABLE "price_preference" (
    "id" text PRIMARY KEY,
    "attribute" text NOT NULL,
    "value" text,
    "is_tax_inclusive" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "price_rule" (
    "id" text PRIMARY KEY,
    "value" text NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "price_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "attribute" text DEFAULT '' NOT NULL,
    "operator" text DEFAULT 'eq' NOT NULL,
    CONSTRAINT "price_rule_operator_check" CHECK (CHECK ((operator = ANY (ARRAY['gte'::text, 'lte'::text, 'gt'::text, 'lt'::text, 'eq'::text]))))
);
CREATE TABLE "price_set" (
    "id" text PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "product" (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "handle" text NOT NULL,
    "subtitle" text,
    "description" text,
    "is_giftcard" boolean DEFAULT false NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "thumbnail" text,
    "weight" text,
    "length" text,
    "height" text,
    "width" text,
    "origin_country" text,
    "hs_code" text,
    "mid_code" text,
    "material" text,
    "collection_id" text,
    "type_id" text,
    "discountable" boolean DEFAULT true NOT NULL,
    "external_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "metadata" jsonb,
    CONSTRAINT "product_status_check" CHECK (CHECK ((status = ANY (ARRAY['draft'::text, 'proposed'::text, 'published'::text, 'rejected'::text]))))
);
CREATE TABLE "product_category" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "description" text DEFAULT '' NOT NULL,
    "handle" text NOT NULL,
    "mpath" text NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "is_internal" boolean DEFAULT false NOT NULL,
    "rank" integer DEFAULT 0 NOT NULL,
    "parent_category_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "metadata" jsonb
);
CREATE TABLE "product_category_product" (
    "product_id" text,
    "product_category_id" text,
    CONSTRAINT "product_category_product_pkey" PRIMARY KEY("product_id","product_category_id")
);
CREATE TABLE "product_collection" (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "handle" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "product_option" (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "product_id" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "product_option_value" (
    "id" text PRIMARY KEY,
    "value" text NOT NULL,
    "option_id" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "product_sales_channel" (
    "product_id" varchar(255),
    "sales_channel_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "product_sales_channel_pkey" PRIMARY KEY("product_id","sales_channel_id")
);
CREATE TABLE "product_shipping_profile" (
    "product_id" varchar(255),
    "shipping_profile_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "product_shipping_profile_pkey" PRIMARY KEY("product_id","shipping_profile_id")
);
CREATE TABLE "product_tag" (
    "id" text PRIMARY KEY,
    "value" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "product_tags" (
    "product_id" text,
    "product_tag_id" text,
    CONSTRAINT "product_tags_pkey" PRIMARY KEY("product_id","product_tag_id")
);
CREATE TABLE "product_type" (
    "id" text PRIMARY KEY,
    "value" text NOT NULL,
    "metadata" json,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "product_variant" (
    "id" text PRIMARY KEY,
    "title" text NOT NULL,
    "sku" text,
    "barcode" text,
    "ean" text,
    "upc" text,
    "allow_backorder" boolean DEFAULT false NOT NULL,
    "manage_inventory" boolean DEFAULT true NOT NULL,
    "hs_code" text,
    "origin_country" text,
    "mid_code" text,
    "material" text,
    "weight" integer,
    "length" integer,
    "height" integer,
    "width" integer,
    "metadata" jsonb,
    "variant_rank" integer DEFAULT 0,
    "product_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "thumbnail" text
);
CREATE TABLE "product_variant_inventory_item" (
    "variant_id" varchar(255),
    "inventory_item_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "required_quantity" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "product_variant_inventory_item_pkey" PRIMARY KEY("variant_id","inventory_item_id")
);
CREATE TABLE "product_variant_option" (
    "variant_id" text,
    "option_value_id" text,
    CONSTRAINT "product_variant_option_pkey" PRIMARY KEY("variant_id","option_value_id")
);
CREATE TABLE "product_variant_price_set" (
    "variant_id" varchar(255),
    "price_set_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "product_variant_price_set_pkey" PRIMARY KEY("variant_id","price_set_id")
);
CREATE TABLE "product_variant_product_image" (
    "id" text PRIMARY KEY,
    "variant_id" text NOT NULL,
    "image_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "promotion" (
    "id" text PRIMARY KEY,
    "code" text NOT NULL,
    "campaign_id" text,
    "is_automatic" boolean DEFAULT false NOT NULL,
    "type" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "status" text DEFAULT 'draft' NOT NULL,
    "is_tax_inclusive" boolean DEFAULT false NOT NULL,
    "limit" integer,
    "used" integer DEFAULT 0 NOT NULL,
    "metadata" jsonb,
    CONSTRAINT "promotion_status_check" CHECK (CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'inactive'::text])))),
    CONSTRAINT "promotion_type_check" CHECK (CHECK ((type = ANY (ARRAY['standard'::text, 'buyget'::text]))))
);
CREATE TABLE "promotion_application_method" (
    "id" text PRIMARY KEY,
    "value" numeric,
    "raw_value" jsonb,
    "max_quantity" integer,
    "apply_to_quantity" integer,
    "buy_rules_min_quantity" integer,
    "type" text NOT NULL,
    "target_type" text NOT NULL,
    "allocation" text,
    "promotion_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "currency_code" text,
    CONSTRAINT "promotion_application_method_allocation_check" CHECK (CHECK ((allocation = ANY (ARRAY['each'::text, 'across'::text, 'once'::text])))),
    CONSTRAINT "promotion_application_method_target_type_check" CHECK (CHECK ((target_type = ANY (ARRAY['order'::text, 'shipping_methods'::text, 'items'::text])))),
    CONSTRAINT "promotion_application_method_type_check" CHECK (CHECK ((type = ANY (ARRAY['fixed'::text, 'percentage'::text]))))
);
CREATE TABLE "promotion_campaign" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "campaign_identifier" text NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "promotion_campaign_budget" (
    "id" text PRIMARY KEY,
    "type" text NOT NULL,
    "campaign_id" text NOT NULL,
    "limit" numeric,
    "raw_limit" jsonb,
    "used" numeric DEFAULT '0' NOT NULL,
    "raw_used" jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "currency_code" text,
    "attribute" text,
    CONSTRAINT "promotion_campaign_budget_type_check" CHECK (CHECK ((type = ANY (ARRAY['spend'::text, 'usage'::text, 'use_by_attribute'::text, 'spend_by_attribute'::text]))))
);
CREATE TABLE "promotion_campaign_budget_usage" (
    "id" text PRIMARY KEY,
    "attribute_value" text NOT NULL,
    "used" numeric DEFAULT '0' NOT NULL,
    "budget_id" text NOT NULL,
    "raw_used" jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "promotion_promotion_rule" (
    "promotion_id" text,
    "promotion_rule_id" text,
    CONSTRAINT "promotion_promotion_rule_pkey" PRIMARY KEY("promotion_id","promotion_rule_id")
);
CREATE TABLE "promotion_rule" (
    "id" text PRIMARY KEY,
    "description" text,
    "attribute" text NOT NULL,
    "operator" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "promotion_rule_operator_check" CHECK (CHECK ((operator = ANY (ARRAY['gte'::text, 'lte'::text, 'gt'::text, 'lt'::text, 'eq'::text, 'ne'::text, 'in'::text]))))
);
CREATE TABLE "promotion_rule_value" (
    "id" text PRIMARY KEY,
    "promotion_rule_id" text NOT NULL,
    "value" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "provider_identity" (
    "id" text PRIMARY KEY,
    "entity_id" text NOT NULL,
    "provider" text NOT NULL,
    "auth_identity_id" text NOT NULL,
    "user_metadata" jsonb,
    "provider_metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "publishable_api_key_sales_channel" (
    "publishable_key_id" varchar(255),
    "sales_channel_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "publishable_api_key_sales_channel_pkey" PRIMARY KEY("publishable_key_id","sales_channel_id")
);
CREATE TABLE "refund" (
    "id" text PRIMARY KEY,
    "amount" numeric NOT NULL,
    "raw_amount" jsonb NOT NULL,
    "payment_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_by" text,
    "metadata" jsonb,
    "refund_reason_id" text,
    "note" text
);
CREATE TABLE "refund_reason" (
    "id" text PRIMARY KEY,
    "label" text NOT NULL,
    "description" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "code" text NOT NULL
);
CREATE TABLE "region" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "currency_code" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "automatic_taxes" boolean DEFAULT true NOT NULL
);
CREATE TABLE "region_country" (
    "iso_2" text PRIMARY KEY,
    "iso_3" text NOT NULL,
    "num_code" text NOT NULL,
    "name" text NOT NULL,
    "display_name" text NOT NULL,
    "region_id" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "region_payment_provider" (
    "region_id" varchar(255),
    "payment_provider_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "region_payment_provider_pkey" PRIMARY KEY("region_id","payment_provider_id")
);
CREATE TABLE "reservation_item" (
    "id" text PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "line_item_id" text,
    "location_id" text NOT NULL,
    "quantity" numeric NOT NULL,
    "external_id" text,
    "description" text,
    "created_by" text,
    "metadata" jsonb,
    "inventory_item_id" text NOT NULL,
    "allow_backorder" boolean DEFAULT false,
    "raw_quantity" jsonb
);
CREATE TABLE "return" (
    "id" text PRIMARY KEY,
    "order_id" text NOT NULL,
    "claim_id" text,
    "exchange_id" text,
    "order_version" integer NOT NULL,
    "display_id" serial,
    "status" return_status_enum DEFAULT 'open' NOT NULL,
    "no_notification" boolean,
    "refund_amount" numeric,
    "raw_refund_amount" jsonb,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "received_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "location_id" text,
    "requested_at" timestamp with time zone,
    "created_by" text
);
CREATE TABLE "return_fulfillment" (
    "return_id" varchar(255),
    "fulfillment_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "return_fulfillment_pkey" PRIMARY KEY("return_id","fulfillment_id")
);
CREATE TABLE "return_item" (
    "id" text PRIMARY KEY,
    "return_id" text NOT NULL,
    "reason_id" text,
    "item_id" text NOT NULL,
    "quantity" numeric NOT NULL,
    "raw_quantity" jsonb NOT NULL,
    "received_quantity" numeric DEFAULT '0' NOT NULL,
    "raw_received_quantity" jsonb DEFAULT '{"value":"0", "precision": 20}' NOT NULL,
    "note" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "damaged_quantity" numeric DEFAULT '0' NOT NULL,
    "raw_damaged_quantity" jsonb DEFAULT '{"value":"0", "precision": 20}' NOT NULL
);
CREATE TABLE "return_reason" (
    "id" varchar PRIMARY KEY,
    "value" varchar NOT NULL,
    "label" varchar NOT NULL,
    "description" varchar,
    "metadata" jsonb,
    "parent_return_reason_id" varchar,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "sales_channel" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "is_disabled" boolean DEFAULT false NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "sales_channel_stock_location" (
    "sales_channel_id" varchar(255),
    "stock_location_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "sales_channel_stock_location_pkey" PRIMARY KEY("sales_channel_id","stock_location_id")
);
CREATE TABLE "script_migrations" (
    "id" serial PRIMARY KEY,
    "script_name" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "finished_at" timestamp with time zone
);
CREATE TABLE "service_zone" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "metadata" jsonb,
    "fulfillment_set_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "shipping_option" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "price_type" text DEFAULT 'flat' NOT NULL,
    "service_zone_id" text NOT NULL,
    "shipping_profile_id" text,
    "provider_id" text,
    "data" jsonb,
    "metadata" jsonb,
    "shipping_option_type_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "shipping_option_price_type_check" CHECK (CHECK ((price_type = ANY (ARRAY['calculated'::text, 'flat'::text]))))
);
CREATE TABLE "shipping_option_price_set" (
    "shipping_option_id" varchar(255),
    "price_set_id" varchar(255),
    "id" varchar(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "shipping_option_price_set_pkey" PRIMARY KEY("shipping_option_id","price_set_id")
);
CREATE TABLE "shipping_option_rule" (
    "id" text PRIMARY KEY,
    "attribute" text NOT NULL,
    "operator" text NOT NULL,
    "value" jsonb,
    "shipping_option_id" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "shipping_option_rule_operator_check" CHECK (CHECK ((operator = ANY (ARRAY['in'::text, 'eq'::text, 'ne'::text, 'gt'::text, 'gte'::text, 'lt'::text, 'lte'::text, 'nin'::text]))))
);
CREATE TABLE "shipping_option_type" (
    "id" text PRIMARY KEY,
    "label" text NOT NULL,
    "description" text,
    "code" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "shipping_profile" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "type" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "stock_location" (
    "id" text PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "name" text NOT NULL,
    "address_id" text,
    "metadata" jsonb
);
CREATE TABLE "stock_location_address" (
    "id" text PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone,
    "address_1" text NOT NULL,
    "address_2" text,
    "company" text,
    "city" text,
    "country_code" text NOT NULL,
    "phone" text,
    "province" text,
    "postal_code" text,
    "metadata" jsonb
);
CREATE TABLE "store" (
    "id" text PRIMARY KEY,
    "name" text DEFAULT 'Medusa Store' NOT NULL,
    "default_sales_channel_id" text,
    "default_region_id" text,
    "default_location_id" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "store_currency" (
    "id" text PRIMARY KEY,
    "currency_code" text NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "store_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "store_locale" (
    "id" text PRIMARY KEY,
    "locale_code" text NOT NULL,
    "store_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "tax_provider" (
    "id" text PRIMARY KEY,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "tax_rate" (
    "id" text PRIMARY KEY,
    "rate" real,
    "code" text NOT NULL,
    "name" text NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "is_combinable" boolean DEFAULT false NOT NULL,
    "tax_region_id" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "created_by" text,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "tax_rate_rule" (
    "id" text PRIMARY KEY,
    "tax_rate_id" text NOT NULL,
    "reference_id" text NOT NULL,
    "reference" text NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "created_by" text,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "tax_region" (
    "id" text PRIMARY KEY,
    "provider_id" text,
    "country_code" text NOT NULL,
    "province_code" text,
    "parent_id" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "created_by" text,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "CK_tax_region_country_top_level" CHECK (CHECK (((parent_id IS NULL) OR (province_code IS NOT NULL)))),
    CONSTRAINT "CK_tax_region_provider_top_level" CHECK (CHECK (((parent_id IS NULL) OR (provider_id IS NULL))))
);
CREATE TABLE "user" (
    "id" text PRIMARY KEY,
    "first_name" text,
    "last_name" text,
    "email" text NOT NULL,
    "avatar_url" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "user_preference" (
    "id" text PRIMARY KEY,
    "user_id" text NOT NULL,
    "key" text NOT NULL,
    "value" jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "view_configuration" (
    "id" text PRIMARY KEY,
    "entity" text NOT NULL,
    "name" text,
    "user_id" text,
    "is_system_default" boolean DEFAULT false NOT NULL,
    "configuration" jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "deleted_at" timestamp with time zone
);
CREATE TABLE "workflow_execution" (
    "id" varchar NOT NULL,
    "workflow_id" varchar,
    "transaction_id" varchar,
    "execution" jsonb,
    "context" jsonb,
    "state" varchar NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "deleted_at" timestamp,
    "retention_time" integer,
    "run_id" text DEFAULT '01KEB991FJBZSVF4NE47Q2J07X',
    CONSTRAINT "workflow_execution_pkey" PRIMARY KEY("workflow_id","transaction_id","run_id")
);
CREATE TABLE "neon_auth"."account" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    "scope" text,
    "password" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);
CREATE TABLE "neon_auth"."invitation" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" uuid NOT NULL,
    "email" text NOT NULL,
    "role" text,
    "status" text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);
CREATE TABLE "neon_auth"."jwks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone
);
CREATE TABLE "neon_auth"."member" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "role" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);
CREATE TABLE "neon_auth"."organization" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "slug" text NOT NULL CONSTRAINT "organization_slug_key" UNIQUE,
    "logo" text,
    "createdAt" timestamp with time zone NOT NULL,
    "metadata" text
);
CREATE TABLE "neon_auth"."project_config" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "endpoint_id" text NOT NULL CONSTRAINT "project_config_endpoint_id_key" UNIQUE,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "trusted_origins" jsonb NOT NULL,
    "social_providers" jsonb NOT NULL,
    "email_provider" jsonb,
    "email_and_password" jsonb,
    "allow_localhost" boolean NOT NULL
);
CREATE TABLE "neon_auth"."session" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "expiresAt" timestamp with time zone NOT NULL,
    "token" text NOT NULL CONSTRAINT "session_token_key" UNIQUE,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);
CREATE TABLE "neon_auth"."user" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "email" text NOT NULL CONSTRAINT "user_email_key" UNIQUE,
    "emailVerified" boolean NOT NULL,
    "image" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "role" text,
    "banned" boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);
CREATE TABLE "neon_auth"."verification" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
ALTER TABLE "application_method_buy_rules" ADD CONSTRAINT "application_method_buy_rules_application_method_id_foreign" FOREIGN KEY ("application_method_id") REFERENCES "promotion_application_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_method_buy_rules" ADD CONSTRAINT "application_method_buy_rules_promotion_rule_id_foreign" FOREIGN KEY ("promotion_rule_id") REFERENCES "promotion_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_method_target_rules" ADD CONSTRAINT "application_method_target_rules_application_method_id_foreign" FOREIGN KEY ("application_method_id") REFERENCES "promotion_application_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_method_target_rules" ADD CONSTRAINT "application_method_target_rules_promotion_rule_id_foreign" FOREIGN KEY ("promotion_rule_id") REFERENCES "promotion_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "capture" ADD CONSTRAINT "capture_payment_id_foreign" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart" ADD CONSTRAINT "cart_billing_address_id_foreign" FOREIGN KEY ("billing_address_id") REFERENCES "cart_address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cart" ADD CONSTRAINT "cart_shipping_address_id_foreign" FOREIGN KEY ("shipping_address_id") REFERENCES "cart_address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cart_line_item" ADD CONSTRAINT "cart_line_item_cart_id_foreign" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_line_item_adjustment" ADD CONSTRAINT "cart_line_item_adjustment_item_id_foreign" FOREIGN KEY ("item_id") REFERENCES "cart_line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_line_item_tax_line" ADD CONSTRAINT "cart_line_item_tax_line_item_id_foreign" FOREIGN KEY ("item_id") REFERENCES "cart_line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_shipping_method" ADD CONSTRAINT "cart_shipping_method_cart_id_foreign" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_shipping_method_adjustment" ADD CONSTRAINT "cart_shipping_method_adjustment_shipping_method_id_foreign" FOREIGN KEY ("shipping_method_id") REFERENCES "cart_shipping_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_shipping_method_tax_line" ADD CONSTRAINT "cart_shipping_method_tax_line_shipping_method_id_foreign" FOREIGN KEY ("shipping_method_id") REFERENCES "cart_shipping_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_line" ADD CONSTRAINT "credit_line_cart_id_foreign" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON UPDATE CASCADE;
ALTER TABLE "customer_address" ADD CONSTRAINT "customer_address_customer_id_foreign" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_group_customer" ADD CONSTRAINT "customer_group_customer_customer_group_id_foreign" FOREIGN KEY ("customer_group_id") REFERENCES "customer_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_group_customer" ADD CONSTRAINT "customer_group_customer_customer_id_foreign" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_delivery_address_id_foreign" FOREIGN KEY ("delivery_address_id") REFERENCES "fulfillment_address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_provider_id_foreign" FOREIGN KEY ("provider_id") REFERENCES "fulfillment_provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fulfillment" ADD CONSTRAINT "fulfillment_shipping_option_id_foreign" FOREIGN KEY ("shipping_option_id") REFERENCES "shipping_option"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_fulfillment_id_foreign" FOREIGN KEY ("fulfillment_id") REFERENCES "fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillment_label" ADD CONSTRAINT "fulfillment_label_fulfillment_id_foreign" FOREIGN KEY ("fulfillment_id") REFERENCES "fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "geo_zone" ADD CONSTRAINT "geo_zone_service_zone_id_foreign" FOREIGN KEY ("service_zone_id") REFERENCES "service_zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "image" ADD CONSTRAINT "image_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_level" ADD CONSTRAINT "inventory_level_inventory_item_id_foreign" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification" ADD CONSTRAINT "notification_provider_id_foreign" FOREIGN KEY ("provider_id") REFERENCES "notification_provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order" ADD CONSTRAINT "order_billing_address_id_foreign" FOREIGN KEY ("billing_address_id") REFERENCES "order_address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order" ADD CONSTRAINT "order_shipping_address_id_foreign" FOREIGN KEY ("shipping_address_id") REFERENCES "order_address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_change" ADD CONSTRAINT "order_change_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_change_action" ADD CONSTRAINT "order_change_action_order_change_id_foreign" FOREIGN KEY ("order_change_id") REFERENCES "order_change"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_credit_line" ADD CONSTRAINT "order_credit_line_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_item_id_foreign" FOREIGN KEY ("item_id") REFERENCES "order_line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_line_item" ADD CONSTRAINT "order_line_item_totals_id_foreign" FOREIGN KEY ("totals_id") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_line_item_adjustment" ADD CONSTRAINT "order_line_item_adjustment_item_id_foreign" FOREIGN KEY ("item_id") REFERENCES "order_line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_line_item_tax_line" ADD CONSTRAINT "order_line_item_tax_line_item_id_foreign" FOREIGN KEY ("item_id") REFERENCES "order_line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_shipping" ADD CONSTRAINT "order_shipping_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_shipping_method_adjustment" ADD CONSTRAINT "order_shipping_method_adjustment_shipping_method_id_foreign" FOREIGN KEY ("shipping_method_id") REFERENCES "order_shipping_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_shipping_method_tax_line" ADD CONSTRAINT "order_shipping_method_tax_line_shipping_method_id_foreign" FOREIGN KEY ("shipping_method_id") REFERENCES "order_shipping_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_summary" ADD CONSTRAINT "order_summary_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_transaction" ADD CONSTRAINT "order_transaction_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment" ADD CONSTRAINT "payment_payment_collection_id_foreign" FOREIGN KEY ("payment_collection_id") REFERENCES "payment_collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_collection_payment_providers" ADD CONSTRAINT "payment_collection_payment_providers_payment_col_aa276_foreign" FOREIGN KEY ("payment_collection_id") REFERENCES "payment_collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_collection_payment_providers" ADD CONSTRAINT "payment_collection_payment_providers_payment_pro_2d555_foreign" FOREIGN KEY ("payment_provider_id") REFERENCES "payment_provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_session" ADD CONSTRAINT "payment_session_payment_collection_id_foreign" FOREIGN KEY ("payment_collection_id") REFERENCES "payment_collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price" ADD CONSTRAINT "price_price_list_id_foreign" FOREIGN KEY ("price_list_id") REFERENCES "price_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price" ADD CONSTRAINT "price_price_set_id_foreign" FOREIGN KEY ("price_set_id") REFERENCES "price_set"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_list_rule" ADD CONSTRAINT "price_list_rule_price_list_id_foreign" FOREIGN KEY ("price_list_id") REFERENCES "price_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_price_id_foreign" FOREIGN KEY ("price_id") REFERENCES "price"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product" ADD CONSTRAINT "product_collection_id_foreign" FOREIGN KEY ("collection_id") REFERENCES "product_collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product" ADD CONSTRAINT "product_type_id_foreign" FOREIGN KEY ("type_id") REFERENCES "product_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_parent_category_id_foreign" FOREIGN KEY ("parent_category_id") REFERENCES "product_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_category_product" ADD CONSTRAINT "product_category_product_product_category_id_foreign" FOREIGN KEY ("product_category_id") REFERENCES "product_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_category_product" ADD CONSTRAINT "product_category_product_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_option" ADD CONSTRAINT "product_option_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_option_value" ADD CONSTRAINT "product_option_value_option_id_foreign" FOREIGN KEY ("option_id") REFERENCES "product_option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_tag_id_foreign" FOREIGN KEY ("product_tag_id") REFERENCES "product_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variant_option" ADD CONSTRAINT "product_variant_option_option_value_id_foreign" FOREIGN KEY ("option_value_id") REFERENCES "product_option_value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variant_option" ADD CONSTRAINT "product_variant_option_variant_id_foreign" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variant_product_image" ADD CONSTRAINT "product_variant_product_image_image_id_foreign" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE;
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_campaign_id_foreign" FOREIGN KEY ("campaign_id") REFERENCES "promotion_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "promotion_application_method" ADD CONSTRAINT "promotion_application_method_promotion_id_foreign" FOREIGN KEY ("promotion_id") REFERENCES "promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_campaign_budget" ADD CONSTRAINT "promotion_campaign_budget_campaign_id_foreign" FOREIGN KEY ("campaign_id") REFERENCES "promotion_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_campaign_budget_usage" ADD CONSTRAINT "promotion_campaign_budget_usage_budget_id_foreign" FOREIGN KEY ("budget_id") REFERENCES "promotion_campaign_budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_promotion_rule" ADD CONSTRAINT "promotion_promotion_rule_promotion_id_foreign" FOREIGN KEY ("promotion_id") REFERENCES "promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_promotion_rule" ADD CONSTRAINT "promotion_promotion_rule_promotion_rule_id_foreign" FOREIGN KEY ("promotion_rule_id") REFERENCES "promotion_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_rule_value" ADD CONSTRAINT "promotion_rule_value_promotion_rule_id_foreign" FOREIGN KEY ("promotion_rule_id") REFERENCES "promotion_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_identity" ADD CONSTRAINT "provider_identity_auth_identity_id_foreign" FOREIGN KEY ("auth_identity_id") REFERENCES "auth_identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_id_foreign" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "region_country" ADD CONSTRAINT "region_country_region_id_foreign" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reservation_item" ADD CONSTRAINT "reservation_item_inventory_item_id_foreign" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "return_reason" ADD CONSTRAINT "return_reason_parent_return_reason_id_foreign" FOREIGN KEY ("parent_return_reason_id") REFERENCES "return_reason"("id");
ALTER TABLE "service_zone" ADD CONSTRAINT "service_zone_fulfillment_set_id_foreign" FOREIGN KEY ("fulfillment_set_id") REFERENCES "fulfillment_set"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shipping_option" ADD CONSTRAINT "shipping_option_provider_id_foreign" FOREIGN KEY ("provider_id") REFERENCES "fulfillment_provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shipping_option" ADD CONSTRAINT "shipping_option_service_zone_id_foreign" FOREIGN KEY ("service_zone_id") REFERENCES "service_zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shipping_option" ADD CONSTRAINT "shipping_option_shipping_option_type_id_foreign" FOREIGN KEY ("shipping_option_type_id") REFERENCES "shipping_option_type"("id") ON UPDATE CASCADE;
ALTER TABLE "shipping_option" ADD CONSTRAINT "shipping_option_shipping_profile_id_foreign" FOREIGN KEY ("shipping_profile_id") REFERENCES "shipping_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shipping_option_rule" ADD CONSTRAINT "shipping_option_rule_shipping_option_id_foreign" FOREIGN KEY ("shipping_option_id") REFERENCES "shipping_option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_location" ADD CONSTRAINT "stock_location_address_id_foreign" FOREIGN KEY ("address_id") REFERENCES "stock_location_address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_currency" ADD CONSTRAINT "store_currency_store_id_foreign" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_locale" ADD CONSTRAINT "store_locale_store_id_foreign" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tax_rate" ADD CONSTRAINT "FK_tax_rate_tax_region_id" FOREIGN KEY ("tax_region_id") REFERENCES "tax_region"("id") ON DELETE CASCADE;
ALTER TABLE "tax_rate_rule" ADD CONSTRAINT "FK_tax_rate_rule_tax_rate_id" FOREIGN KEY ("tax_rate_id") REFERENCES "tax_rate"("id") ON DELETE CASCADE;
ALTER TABLE "tax_region" ADD CONSTRAINT "FK_tax_region_parent_id" FOREIGN KEY ("parent_id") REFERENCES "tax_region"("id") ON DELETE CASCADE;
ALTER TABLE "tax_region" ADD CONSTRAINT "FK_tax_region_provider_id" FOREIGN KEY ("provider_id") REFERENCES "tax_provider"("id") ON DELETE SET NULL;
ALTER TABLE "neon_auth"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "neon_auth"."organization"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "neon_auth"."organization"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX "account_holder_pkey" ON "account_holder" ("id");
CREATE INDEX "IDX_account_holder_deleted_at" ON "account_holder" ("deleted_at");
CREATE UNIQUE INDEX "IDX_account_holder_provider_id_external_id_unique" ON "account_holder" ("provider_id","external_id");
CREATE UNIQUE INDEX "api_key_pkey" ON "api_key" ("id");
CREATE INDEX "IDX_api_key_deleted_at" ON "api_key" ("deleted_at");
CREATE INDEX "IDX_api_key_redacted" ON "api_key" ("redacted");
CREATE INDEX "IDX_api_key_revoked_at" ON "api_key" ("revoked_at");
CREATE UNIQUE INDEX "IDX_api_key_token_unique" ON "api_key" ("token");
CREATE INDEX "IDX_api_key_type" ON "api_key" ("type");
CREATE UNIQUE INDEX "application_method_buy_rules_pkey" ON "application_method_buy_rules" ("application_method_id","promotion_rule_id");
CREATE UNIQUE INDEX "application_method_target_rules_pkey" ON "application_method_target_rules" ("application_method_id","promotion_rule_id");
CREATE UNIQUE INDEX "auth_identity_pkey" ON "auth_identity" ("id");
CREATE INDEX "IDX_auth_identity_deleted_at" ON "auth_identity" ("deleted_at");
CREATE UNIQUE INDEX "capture_pkey" ON "capture" ("id");
CREATE INDEX "IDX_capture_deleted_at" ON "capture" ("deleted_at");
CREATE INDEX "IDX_capture_payment_id" ON "capture" ("payment_id");
CREATE UNIQUE INDEX "cart_pkey" ON "cart" ("id");
CREATE INDEX "IDX_cart_billing_address_id" ON "cart" ("billing_address_id");
CREATE INDEX "IDX_cart_currency_code" ON "cart" ("currency_code");
CREATE INDEX "IDX_cart_customer_id" ON "cart" ("customer_id");
CREATE INDEX "IDX_cart_deleted_at" ON "cart" ("deleted_at");
CREATE INDEX "IDX_cart_region_id" ON "cart" ("region_id");
CREATE INDEX "IDX_cart_sales_channel_id" ON "cart" ("sales_channel_id");
CREATE INDEX "IDX_cart_shipping_address_id" ON "cart" ("shipping_address_id");
CREATE UNIQUE INDEX "cart_address_pkey" ON "cart_address" ("id");
CREATE INDEX "IDX_cart_address_deleted_at" ON "cart_address" ("deleted_at");
CREATE UNIQUE INDEX "cart_line_item_pkey" ON "cart_line_item" ("id");
CREATE INDEX "IDX_cart_line_item_cart_id" ON "cart_line_item" ("cart_id");
CREATE INDEX "IDX_cart_line_item_deleted_at" ON "cart_line_item" ("deleted_at");
CREATE INDEX "IDX_line_item_product_id" ON "cart_line_item" ("product_id");
CREATE INDEX "IDX_line_item_variant_id" ON "cart_line_item" ("variant_id");
CREATE UNIQUE INDEX "cart_line_item_adjustment_pkey" ON "cart_line_item_adjustment" ("id");
CREATE INDEX "IDX_cart_line_item_adjustment_deleted_at" ON "cart_line_item_adjustment" ("deleted_at");
CREATE INDEX "IDX_cart_line_item_adjustment_item_id" ON "cart_line_item_adjustment" ("item_id");
CREATE INDEX "IDX_line_item_adjustment_promotion_id" ON "cart_line_item_adjustment" ("promotion_id");
CREATE UNIQUE INDEX "cart_line_item_tax_line_pkey" ON "cart_line_item_tax_line" ("id");
CREATE INDEX "IDX_cart_line_item_tax_line_deleted_at" ON "cart_line_item_tax_line" ("deleted_at");
CREATE INDEX "IDX_cart_line_item_tax_line_item_id" ON "cart_line_item_tax_line" ("item_id");
CREATE INDEX "IDX_line_item_tax_line_tax_rate_id" ON "cart_line_item_tax_line" ("tax_rate_id");
CREATE UNIQUE INDEX "cart_payment_collection_pkey" ON "cart_payment_collection" ("cart_id","payment_collection_id");
CREATE INDEX "IDX_cart_id_-4a39f6c9" ON "cart_payment_collection" ("cart_id");
CREATE INDEX "IDX_deleted_at_-4a39f6c9" ON "cart_payment_collection" ("deleted_at");
CREATE INDEX "IDX_id_-4a39f6c9" ON "cart_payment_collection" ("id");
CREATE INDEX "IDX_payment_collection_id_-4a39f6c9" ON "cart_payment_collection" ("payment_collection_id");
CREATE UNIQUE INDEX "cart_promotion_pkey" ON "cart_promotion" ("cart_id","promotion_id");
CREATE INDEX "IDX_cart_id_-a9d4a70b" ON "cart_promotion" ("cart_id");
CREATE INDEX "IDX_deleted_at_-a9d4a70b" ON "cart_promotion" ("deleted_at");
CREATE INDEX "IDX_id_-a9d4a70b" ON "cart_promotion" ("id");
CREATE INDEX "IDX_promotion_id_-a9d4a70b" ON "cart_promotion" ("promotion_id");
CREATE UNIQUE INDEX "cart_shipping_method_pkey" ON "cart_shipping_method" ("id");
CREATE INDEX "IDX_cart_shipping_method_cart_id" ON "cart_shipping_method" ("cart_id");
CREATE INDEX "IDX_cart_shipping_method_deleted_at" ON "cart_shipping_method" ("deleted_at");
CREATE INDEX "IDX_shipping_method_option_id" ON "cart_shipping_method" ("shipping_option_id");
CREATE UNIQUE INDEX "cart_shipping_method_adjustment_pkey" ON "cart_shipping_method_adjustment" ("id");
CREATE INDEX "IDX_cart_shipping_method_adjustment_deleted_at" ON "cart_shipping_method_adjustment" ("deleted_at");
CREATE INDEX "IDX_cart_shipping_method_adjustment_shipping_method_id" ON "cart_shipping_method_adjustment" ("shipping_method_id");
CREATE INDEX "IDX_shipping_method_adjustment_promotion_id" ON "cart_shipping_method_adjustment" ("promotion_id");
CREATE UNIQUE INDEX "cart_shipping_method_tax_line_pkey" ON "cart_shipping_method_tax_line" ("id");
CREATE INDEX "IDX_cart_shipping_method_tax_line_deleted_at" ON "cart_shipping_method_tax_line" ("deleted_at");
CREATE INDEX "IDX_cart_shipping_method_tax_line_shipping_method_id" ON "cart_shipping_method_tax_line" ("shipping_method_id");
CREATE INDEX "IDX_shipping_method_tax_line_tax_rate_id" ON "cart_shipping_method_tax_line" ("tax_rate_id");
CREATE UNIQUE INDEX "credit_line_pkey" ON "credit_line" ("id");
CREATE INDEX "IDX_cart_credit_line_reference_reference_id" ON "credit_line" ("reference","reference_id");
CREATE INDEX "IDX_credit_line_cart_id" ON "credit_line" ("cart_id");
CREATE INDEX "IDX_credit_line_deleted_at" ON "credit_line" ("deleted_at");
CREATE UNIQUE INDEX "currency_pkey" ON "currency" ("code");
CREATE UNIQUE INDEX "customer_pkey" ON "customer" ("id");
CREATE INDEX "IDX_customer_deleted_at" ON "customer" ("deleted_at");
CREATE UNIQUE INDEX "IDX_customer_email_has_account_unique" ON "customer" ("email","has_account");
CREATE UNIQUE INDEX "customer_account_holder_pkey" ON "customer_account_holder" ("customer_id","account_holder_id");
CREATE INDEX "IDX_account_holder_id_5cb3a0c0" ON "customer_account_holder" ("account_holder_id");
CREATE INDEX "IDX_customer_id_5cb3a0c0" ON "customer_account_holder" ("customer_id");
CREATE INDEX "IDX_deleted_at_5cb3a0c0" ON "customer_account_holder" ("deleted_at");
CREATE INDEX "IDX_id_5cb3a0c0" ON "customer_account_holder" ("id");
CREATE UNIQUE INDEX "customer_address_pkey" ON "customer_address" ("id");
CREATE INDEX "IDX_customer_address_customer_id" ON "customer_address" ("customer_id");
CREATE INDEX "IDX_customer_address_deleted_at" ON "customer_address" ("deleted_at");
CREATE UNIQUE INDEX "IDX_customer_address_unique_customer_billing" ON "customer_address" ("customer_id");
CREATE UNIQUE INDEX "IDX_customer_address_unique_customer_shipping" ON "customer_address" ("customer_id");
CREATE UNIQUE INDEX "customer_group_pkey" ON "customer_group" ("id");
CREATE INDEX "IDX_customer_group_deleted_at" ON "customer_group" ("deleted_at");
CREATE UNIQUE INDEX "IDX_customer_group_name_unique" ON "customer_group" ("name");
CREATE UNIQUE INDEX "customer_group_customer_pkey" ON "customer_group_customer" ("id");
CREATE INDEX "IDX_customer_group_customer_customer_group_id" ON "customer_group_customer" ("customer_group_id");
CREATE INDEX "IDX_customer_group_customer_customer_id" ON "customer_group_customer" ("customer_id");
CREATE INDEX "IDX_customer_group_customer_deleted_at" ON "customer_group_customer" ("deleted_at");
CREATE UNIQUE INDEX "fulfillment_pkey" ON "fulfillment" ("id");
CREATE INDEX "IDX_fulfillment_deleted_at" ON "fulfillment" ("deleted_at");
CREATE INDEX "IDX_fulfillment_location_id" ON "fulfillment" ("location_id");
CREATE INDEX "IDX_fulfillment_shipping_option_id" ON "fulfillment" ("shipping_option_id");
CREATE UNIQUE INDEX "fulfillment_address_pkey" ON "fulfillment_address" ("id");
CREATE INDEX "IDX_fulfillment_address_deleted_at" ON "fulfillment_address" ("deleted_at");
CREATE UNIQUE INDEX "fulfillment_item_pkey" ON "fulfillment_item" ("id");
CREATE INDEX "IDX_fulfillment_item_deleted_at" ON "fulfillment_item" ("deleted_at");
CREATE INDEX "IDX_fulfillment_item_fulfillment_id" ON "fulfillment_item" ("fulfillment_id");
CREATE INDEX "IDX_fulfillment_item_inventory_item_id" ON "fulfillment_item" ("inventory_item_id");
CREATE INDEX "IDX_fulfillment_item_line_item_id" ON "fulfillment_item" ("line_item_id");
CREATE UNIQUE INDEX "fulfillment_label_pkey" ON "fulfillment_label" ("id");
CREATE INDEX "IDX_fulfillment_label_deleted_at" ON "fulfillment_label" ("deleted_at");
CREATE INDEX "IDX_fulfillment_label_fulfillment_id" ON "fulfillment_label" ("fulfillment_id");
CREATE UNIQUE INDEX "fulfillment_provider_pkey" ON "fulfillment_provider" ("id");
CREATE INDEX "IDX_fulfillment_provider_deleted_at" ON "fulfillment_provider" ("deleted_at");
CREATE UNIQUE INDEX "fulfillment_set_pkey" ON "fulfillment_set" ("id");
CREATE INDEX "IDX_fulfillment_set_deleted_at" ON "fulfillment_set" ("deleted_at");
CREATE UNIQUE INDEX "IDX_fulfillment_set_name_unique" ON "fulfillment_set" ("name");
CREATE UNIQUE INDEX "geo_zone_pkey" ON "geo_zone" ("id");
CREATE INDEX "IDX_geo_zone_city" ON "geo_zone" ("city");
CREATE INDEX "IDX_geo_zone_country_code" ON "geo_zone" ("country_code");
CREATE INDEX "IDX_geo_zone_deleted_at" ON "geo_zone" ("deleted_at");
CREATE INDEX "IDX_geo_zone_province_code" ON "geo_zone" ("province_code");
CREATE INDEX "IDX_geo_zone_service_zone_id" ON "geo_zone" ("service_zone_id");
CREATE INDEX "IDX_image_deleted_at" ON "image" ("deleted_at");
CREATE INDEX "IDX_image_product_id" ON "image" ("product_id");
CREATE INDEX "IDX_product_image_rank" ON "image" ("rank");
CREATE INDEX "IDX_product_image_rank_product_id" ON "image" ("rank","product_id");
CREATE INDEX "IDX_product_image_url" ON "image" ("url");
CREATE INDEX "IDX_product_image_url_rank_product_id" ON "image" ("url","rank","rank","product_id");
CREATE UNIQUE INDEX "image_pkey" ON "image" ("id");

```
