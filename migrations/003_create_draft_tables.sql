-- Migration: Create Fantasy Draft Tables
-- Creates tables for drafts, players, and draft picks

-- Create enums for draft-related types
DO $$ BEGIN
    CREATE TYPE "sport" AS ENUM('NBA', 'NFL', 'MLB');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "draft_type" AS ENUM('snake', 'auction', 'linear');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "scoring_type" AS ENUM('standard', 'ppr', 'half_ppr', 'points', 'categories');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "draft_status" AS ENUM('setup', 'in_progress', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drafts table
CREATE TABLE IF NOT EXISTS "drafts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" text NOT NULL,
    "sport" "sport" NOT NULL DEFAULT 'NBA',
    "draft_type" "draft_type" NOT NULL DEFAULT 'snake',
    "league_name" text,
    "num_teams" integer NOT NULL DEFAULT 12,
    "draft_position" integer NOT NULL DEFAULT 1,
    "scoring_type" "scoring_type" NOT NULL DEFAULT 'points',
    "roster_size" integer NOT NULL DEFAULT 13,
    "current_round" integer DEFAULT 1,
    "current_pick" integer DEFAULT 1,
    "status" "draft_status" NOT NULL DEFAULT 'setup',
    "settings" jsonb,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Players table (for Sleeper API data)
CREATE TABLE IF NOT EXISTS "players" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "sleeper_id" text UNIQUE,
    "sport" "sport" NOT NULL DEFAULT 'NBA',
    "first_name" text,
    "last_name" text,
    "full_name" text NOT NULL,
    "team" text,
    "position" text,
    "positions" jsonb,
    "age" integer,
    "adp" integer,
    "projected_points" integer,
    "injury_status" text,
    "status" text,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Draft Picks table
CREATE TABLE IF NOT EXISTS "draft_picks" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "draft_id" uuid NOT NULL REFERENCES "drafts"("id") ON DELETE CASCADE,
    "player_id" uuid NOT NULL REFERENCES "players"("id"),
    "team_number" integer NOT NULL,
    "round" integer NOT NULL,
    "pick_number" integer NOT NULL,
    "pick_in_round" integer NOT NULL,
    "is_user_pick" boolean DEFAULT false,
    "created_at" timestamp DEFAULT now()
);

-- Indexes for drafts
CREATE INDEX IF NOT EXISTS "idx_drafts_user_id" ON "drafts"("user_id");
CREATE INDEX IF NOT EXISTS "idx_drafts_status" ON "drafts"("status");
CREATE INDEX IF NOT EXISTS "idx_drafts_created_at" ON "drafts"("created_at" DESC);

-- Indexes for players
CREATE INDEX IF NOT EXISTS "idx_players_sport" ON "players"("sport");
CREATE INDEX IF NOT EXISTS "idx_players_team" ON "players"("team");
CREATE INDEX IF NOT EXISTS "idx_players_position" ON "players"("position");
CREATE INDEX IF NOT EXISTS "idx_players_full_name" ON "players"("full_name");
CREATE INDEX IF NOT EXISTS "idx_players_sleeper_id" ON "players"("sleeper_id");

-- Indexes for draft_picks
CREATE INDEX IF NOT EXISTS "idx_draft_picks_draft_id" ON "draft_picks"("draft_id");
CREATE INDEX IF NOT EXISTS "idx_draft_picks_player_id" ON "draft_picks"("player_id");
CREATE INDEX IF NOT EXISTS "idx_draft_picks_team_number" ON "draft_picks"("team_number");

-- FK constraint for drafts.user_id -> user.id (Better Auth)
ALTER TABLE "drafts"
ADD CONSTRAINT "fk_drafts_user_id"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
