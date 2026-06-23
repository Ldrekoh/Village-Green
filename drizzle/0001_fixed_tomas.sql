ALTER TABLE "invoices" ADD CONSTRAINT "check_paid_invoice_payment_info" CHECK (
          "invoices"."is_paid" = false
            OR (
                "invoices"."payment_method" IS NOT NULL
                AND "invoices"."payment_info" IS NOT NULL
                AND "invoices"."payment_info"->>'type' = "invoices"."payment_method"::text
            )
        );