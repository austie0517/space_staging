-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."availabilities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "space_id" UUID NOT NULL,
    "bookable_level" VARCHAR(20) NOT NULL DEFAULT 'both',
    "repeat_type" VARCHAR(20) NOT NULL DEFAULT 'none',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "day_of_week" INTEGER[],
    "exception_dates" DATE[] DEFAULT ARRAY[]::DATE[],
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "booking_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    "unit_price" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,

    CONSTRAINT "booking_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "space_id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "booking_level" VARCHAR(20) NOT NULL DEFAULT 'space',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "start_at" TIMESTAMP(6) NOT NULL,
    "end_at" TIMESTAMP(6) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "option_total" INTEGER NOT NULL DEFAULT 0,
    "platform_fee" INTEGER NOT NULL DEFAULT 0,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "total_price" INTEGER NOT NULL DEFAULT 0,
    "coupon_id" UUID,
    "discount_note" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."coupon_uses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "coupon_id" UUID NOT NULL,
    "guest_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "used_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_uses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."coupons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "discount_type" VARCHAR(20) NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "host_id" UUID,
    "space_id" UUID,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "max_uses_per_guest" INTEGER DEFAULT 1,
    "valid_from" DATE,
    "valid_until" DATE,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."discounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "guest_id" UUID NOT NULL,
    "host_id" UUID,
    "space_id" UUID,
    "discount_type" VARCHAR(20) NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "valid_from" DATE,
    "valid_until" DATE,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."favorites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."guest_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "profession" VARCHAR(100),
    "is_auto_approved" BOOLEAN DEFAULT false,
    "review_note" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."guests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "profession" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."host_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "id_document_url" TEXT,
    "id_document_type" VARCHAR(50),
    "review_note" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hosts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "stripe_account_id" VARCHAR(255),
    "plan" VARCHAR(20) DEFAULT 'free',
    "zipcode" VARCHAR(8),
    "prefecture" VARCHAR(20),
    "city" VARCHAR(50),
    "town" VARCHAR(100),
    "building" VARCHAR(100),
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kyc_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "doc_type" VARCHAR(40) NOT NULL,
    "image_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."line_connections" (
    "user_id" UUID NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "line_user_id" TEXT,
    "display_name" TEXT,
    "notif_booking_confirmed" BOOLEAN NOT NULL DEFAULT true,
    "notif_cancelled" BOOLEAN NOT NULL DEFAULT true,
    "notif_entry_pin" BOOLEAN NOT NULL DEFAULT true,
    "notif_exit_reminder" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_connections_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50),
    "title" VARCHAR(255),
    "sent_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "body" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "stripe_payment_method_id" TEXT,
    "brand" VARCHAR(20),
    "last4" CHAR(4),
    "exp_month" INTEGER,
    "exp_year" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "booking_id" UUID NOT NULL,
    "payment_intent_id" VARCHAR(255),
    "amount" INTEGER NOT NULL,
    "status" VARCHAR(20),
    "paid_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "stripe_charge_id" TEXT,
    "stripe_refund_id" TEXT,
    "failure_reason" TEXT,
    "receipt_url" TEXT,
    "refunded_amount" INTEGER,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pricing_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "space_id" UUID NOT NULL,
    "rule_name" VARCHAR(100),
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "price_type" VARCHAR(20) DEFAULT 'hourly',
    "price" INTEGER NOT NULL,
    "priority" INTEGER DEFAULT 0,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."repeat_discounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "space_id" UUID NOT NULL,
    "min_bookings" INTEGER NOT NULL,
    "discount_type" VARCHAR(20) NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "count_window_days" INTEGER,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repeat_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID,
    "guest_id" UUID NOT NULL,
    "space_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settlements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "host_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "booking_total" INTEGER NOT NULL DEFAULT 0,
    "platform_fee" INTEGER NOT NULL DEFAULT 0,
    "payout_amount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."space_fields" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "space_id" UUID NOT NULL,
    "field_key" VARCHAR(50) NOT NULL,
    "field_label" VARCHAR(80) NOT NULL,
    "field_value" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "field_type" VARCHAR(20) NOT NULL DEFAULT 'text',
    "options" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."space_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "space_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_cover" BOOLEAN DEFAULT false,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."space_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "space_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price_type" VARCHAR(20) NOT NULL,
    "price" INTEGER NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "space_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."space_tag_relations" (
    "space_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "space_tag_relations_pkey" PRIMARY KEY ("space_id","tag_id")
);

-- CreateTable
CREATE TABLE "public"."space_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "category" VARCHAR(40),

    CONSTRAINT "space_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."spaces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "host_id" UUID NOT NULL,
    "parent_space_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "space_type" VARCHAR(50) NOT NULL,
    "resource_category" VARCHAR(40) NOT NULL DEFAULT 'venue',
    "capacity_unit" VARCHAR(20) NOT NULL DEFAULT 'person',
    "attributes" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "pitch_title" VARCHAR(120),
    "pitch_body" TEXT,
    "min_booking_hours" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "zipcode" VARCHAR(8),
    "prefecture" VARCHAR(20),
    "city" VARCHAR(50),
    "town" VARCHAR(100),
    "building" VARCHAR(100),
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "name" VARCHAR(255) NOT NULL,
    "is_host" BOOLEAN NOT NULL DEFAULT false,
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_availabilities_space" ON "public"."availabilities"("space_id" ASC);

-- CreateIndex
CREATE INDEX "idx_bookings_guest" ON "public"."bookings"("guest_id" ASC);

-- CreateIndex
CREATE INDEX "idx_bookings_space_time" ON "public"."bookings"("space_id" ASC, "start_at" ASC, "end_at" ASC);

-- CreateIndex
CREATE INDEX "idx_bookings_status" ON "public"."bookings"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_bookings_created" ON "public"."bookings"("created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "public"."coupons"("code" ASC);

-- CreateIndex
CREATE INDEX "idx_discounts_guest" ON "public"."discounts"("guest_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_space_id_key" ON "public"."favorites"("user_id" ASC, "space_id" ASC);

-- CreateIndex
CREATE INDEX "idx_favorites_user" ON "public"."favorites"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "guest_applications_user_id_key" ON "public"."guest_applications"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "guests_user_id_key" ON "public"."guests"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "host_applications_user_id_key" ON "public"."host_applications"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "hosts_user_id_key" ON "public"."hosts"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_kyc_status" ON "public"."kyc_submissions"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "public"."notifications"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_pm_user" ON "public"."payment_methods"("user_id" ASC);

-- CreateIndex
CREATE INDEX "idx_payments_booking" ON "public"."payments"("booking_id" ASC);

-- CreateIndex
CREATE INDEX "idx_reviews_space" ON "public"."reviews"("space_id" ASC);

-- CreateIndex
CREATE INDEX "idx_settlements_host" ON "public"."settlements"("host_id" ASC);

-- CreateIndex
CREATE INDEX "idx_space_fields_space" ON "public"."space_fields"("space_id" ASC, "display_order" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "space_tags_name_key" ON "public"."space_tags"("name" ASC);

-- CreateIndex
CREATE INDEX "idx_spaces_host" ON "public"."spaces"("host_id" ASC);

-- CreateIndex
CREATE INDEX "idx_spaces_parent_space" ON "public"."spaces"("parent_space_id" ASC);

-- CreateIndex
CREATE INDEX "idx_spaces_name_trgm" ON "public"."spaces" ("name");
-- CREATE INDEX "idx_spaces_name_trgm" ON "public"."spaces" USING GIN ("name" ASC);

-- CreateIndex
CREATE INDEX "idx_spaces_status" ON "public"."spaces"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."availabilities" ADD CONSTRAINT "availabilities_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."booking_options" ADD CONSTRAINT "booking_options_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."booking_options" ADD CONSTRAINT "booking_options_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."space_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."coupon_uses" ADD CONSTRAINT "coupon_uses_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."coupon_uses" ADD CONSTRAINT "coupon_uses_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."coupon_uses" ADD CONSTRAINT "coupon_uses_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."coupons" ADD CONSTRAINT "coupons_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."coupons" ADD CONSTRAINT "coupons_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."guest_applications" ADD CONSTRAINT "guest_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."guest_applications" ADD CONSTRAINT "guest_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."guests" ADD CONSTRAINT "guests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."host_applications" ADD CONSTRAINT "host_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."host_applications" ADD CONSTRAINT "host_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."hosts" ADD CONSTRAINT "hosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."kyc_submissions" ADD CONSTRAINT "kyc_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."kyc_submissions" ADD CONSTRAINT "kyc_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."line_connections" ADD CONSTRAINT "line_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."pricing_rules" ADD CONSTRAINT "pricing_rules_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."repeat_discounts" ADD CONSTRAINT "repeat_discounts_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."settlements" ADD CONSTRAINT "settlements_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."space_fields" ADD CONSTRAINT "space_fields_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."space_images" ADD CONSTRAINT "space_images_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."space_options" ADD CONSTRAINT "space_options_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."space_tag_relations" ADD CONSTRAINT "space_tag_relations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."space_tag_relations" ADD CONSTRAINT "space_tag_relations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."space_tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."spaces" ADD CONSTRAINT "spaces_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."spaces" ADD CONSTRAINT "spaces_parent_space_id_fkey" FOREIGN KEY ("parent_space_id") REFERENCES "public"."spaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Resource model checks
ALTER TABLE "public"."spaces" ADD CONSTRAINT "spaces_resource_category_check" CHECK ("resource_category" IN ('venue', 'parking', 'storage'));
ALTER TABLE "public"."spaces" ADD CONSTRAINT "spaces_capacity_unit_check" CHECK ("capacity_unit" IN ('person', 'car', 'box'));
ALTER TABLE "public"."spaces" ADD CONSTRAINT "spaces_min_booking_hours_check" CHECK ("min_booking_hours" >= 1 AND "min_booking_hours" <= 24);
ALTER TABLE "public"."availabilities" ADD CONSTRAINT "availabilities_bookable_level_check" CHECK ("bookable_level" IN ('seat', 'space', 'both', 'closed'));
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_booking_level_check" CHECK ("booking_level" IN ('space', 'seat'));
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_quantity_check" CHECK ("quantity" > 0);

CREATE OR REPLACE FUNCTION public.booking_conflict_resource_ids(p_space_id uuid)
RETURNS TABLE(resource_id uuid)
LANGUAGE sql
STABLE
AS $$
  WITH selected AS (
    SELECT id, parent_space_id
    FROM public.spaces
    WHERE id = p_space_id
  )
  SELECT id FROM selected
  UNION
  SELECT parent_space_id
  FROM selected
  WHERE parent_space_id IS NOT NULL
  UNION
  SELECT child.id
  FROM public.spaces child
  JOIN selected parent
    ON child.parent_space_id = parent.id
  WHERE parent.parent_space_id IS NULL
$$;

CREATE OR REPLACE FUNCTION public.prevent_resource_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'rejected') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings existing
    WHERE existing.id <> NEW.id
      AND existing.status NOT IN ('cancelled', 'rejected')
      AND existing.start_at < NEW.end_at
      AND existing.end_at > NEW.start_at
      AND existing.space_id IN (
        SELECT resource_id
        FROM public.booking_conflict_resource_ids(NEW.space_id)
      )
  ) THEN
    RAISE EXCEPTION 'resource booking overlaps parent/child resource'
      USING ERRCODE = '23P01', CONSTRAINT = 'bookings_no_overlap';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_resource_booking_overlap
BEFORE INSERT OR UPDATE OF space_id, start_at, end_at, status
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_resource_booking_overlap();
