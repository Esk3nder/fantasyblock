-- Migration: Add Foreign Key Constraints and Indexes
-- Links application tables to Better Auth user table for cascading deletes

-- Add FK constraints to Better Auth's user table
-- Note: Better Auth creates a "user" table with "id" as the primary key

-- user_profile.user_id -> user.id
ALTER TABLE "user_profile"
ADD CONSTRAINT "fk_user_profile_user_id"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- conversations.user_id -> user.id
ALTER TABLE "conversations"
ADD CONSTRAINT "fk_conversations_user_id"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- messages.user_id -> user.id
ALTER TABLE "messages"
ADD CONSTRAINT "fk_messages_user_id"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- message_feedback.user_id -> user.id
ALTER TABLE "message_feedback"
ADD CONSTRAINT "fk_message_feedback_user_id"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- user_settings.user_id -> user.id
ALTER TABLE "user_settings"
ADD CONSTRAINT "fk_user_settings_user_id"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- brand_analyses.user_id -> user.id
ALTER TABLE "brand_analyses"
ADD CONSTRAINT "fk_brand_analyses_user_id"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- Add indexes for created_at columns (for sorting/pagination performance)
CREATE INDEX IF NOT EXISTS "idx_conversations_created_at" ON "conversations"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_brand_analyses_created_at" ON "brand_analyses"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_messages_created_at" ON "messages"("created_at" DESC);
