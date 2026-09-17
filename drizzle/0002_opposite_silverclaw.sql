CREATE TABLE "managed_firefly_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"base_url" text NOT NULL,
	"remote_user_id" text NOT NULL,
	"remote_email" text NOT NULL,
	"password_ciphertext" text NOT NULL,
	"password_nonce" text NOT NULL,
	"password_auth_tag" text NOT NULL,
	"key_version" smallint DEFAULT 1 NOT NULL,
	"last_provisioned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "managed_firefly_users" ADD CONSTRAINT "managed_firefly_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "managed_firefly_users_user_base_url_unique" ON "managed_firefly_users" USING btree ("user_id","base_url");--> statement-breakpoint
CREATE INDEX "managed_firefly_users_user_idx" ON "managed_firefly_users" USING btree ("user_id");