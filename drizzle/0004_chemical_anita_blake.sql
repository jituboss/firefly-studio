CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
-- Bootstrap the administrator on a deployment that already has accounts.
--
-- Every existing row defaults to 'user', which on an upgrade would leave an
-- instance with an admin page nobody can open. The first account ever
-- registered here is the person who stood this deployment up, so it becomes the
-- administrator; everyone else is granted the role by them, or from the command
-- line with `node dist/user-admin.cjs grant <email>`.
--
-- The demo account is excluded on purpose: its credentials are published, and
-- handing every visitor the admin page would be handing them every other
-- account on the instance. A demo-only deployment ends up with no admin, which
-- is the safe answer — the command line is how it gets one.
UPDATE "users" SET "role" = 'admin'
WHERE "id" = (
  SELECT "id" FROM "users"
  WHERE "deleted_at" IS NULL AND "is_demo" = false
  ORDER BY "created_at" ASC
  LIMIT 1
);
