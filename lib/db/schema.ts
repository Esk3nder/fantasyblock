import { pgTable, text, timestamp, uuid, boolean, jsonb, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['user', 'assistant']);
export const themeEnum = pgEnum('theme', ['light', 'dark']);
export const sportEnum = pgEnum('sport', ['NBA', 'NFL', 'MLB']);
export const draftTypeEnum = pgEnum('draft_type', ['snake', 'auction', 'linear']);
export const scoringTypeEnum = pgEnum('scoring_type', ['standard', 'ppr', 'half_ppr', 'points', 'categories']);
export const draftStatusEnum = pgEnum('draft_status', ['setup', 'in_progress', 'completed', 'abandoned']);

// User Profile table - extends Better Auth user with additional fields
export const userProfile = pgTable('user_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Conversations table - stores chat threads
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  title: text('title'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Messages table - stores individual chat messages
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  role: roleEnum('role').notNull(),
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Message Feedback table - for rating AI responses
export const messageFeedback = pgTable('message_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  rating: integer('rating'), // 1-5
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User Settings table - app-specific preferences
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  theme: themeEnum('theme').default('light'),
  emailNotifications: boolean('email_notifications').default(true),
  marketingEmails: boolean('marketing_emails').default(false),
  defaultModel: text('default_model').default('gpt-3.5-turbo'),
  metadata: jsonb('metadata'), // For any additional settings
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Define relations without user table reference
export const userProfileRelations = relations(userProfile, ({ many }) => ({
  conversations: many(conversations),
  brandAnalyses: many(brandAnalyses),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  userProfile: one(userProfile, {
    fields: [conversations.userId],
    references: [userProfile.userId],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  feedback: many(messageFeedback),
}));

export const messageFeedbackRelations = relations(messageFeedback, ({ one }) => ({
  message: one(messages, {
    fields: [messageFeedback.messageId],
    references: [messages.id],
  }),
}));

// Brand Monitor Analyses
export const brandAnalyses = pgTable('brand_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  url: text('url').notNull(),
  companyName: text('company_name'),
  industry: text('industry'),
  analysisData: jsonb('analysis_data'), // Stores the full analysis results
  competitors: jsonb('competitors'), // Stores competitor data
  prompts: jsonb('prompts'), // Stores the prompts used
  creditsUsed: integer('credits_used').default(10),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Relations
export const brandAnalysesRelations = relations(brandAnalyses, ({ one }) => ({
  userProfile: one(userProfile, {
    fields: [brandAnalyses.userId],
    references: [userProfile.userId],
  }),
}));

// ============================================
// Fantasy Draft Tables
// ============================================

// Drafts table - stores draft configurations
export const drafts = pgTable('drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  sport: sportEnum('sport').notNull().default('NBA'),
  draftType: draftTypeEnum('draft_type').notNull().default('snake'),
  leagueName: text('league_name'),
  numTeams: integer('num_teams').notNull().default(12),
  draftPosition: integer('draft_position').notNull().default(1),
  scoringType: scoringTypeEnum('scoring_type').notNull().default('points'),
  rosterSize: integer('roster_size').notNull().default(13),
  currentRound: integer('current_round').default(1),
  currentPick: integer('current_pick').default(1),
  status: draftStatusEnum('status').notNull().default('setup'),
  settings: jsonb('settings'), // Additional settings like roster positions
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_drafts_user_id').on(table.userId),
  index('idx_drafts_status').on(table.status),
  index('idx_drafts_created_at').on(table.createdAt),
]);

// Players table - stores player data from Sleeper API
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  sleeperId: text('sleeper_id').unique(),
  sport: sportEnum('sport').notNull().default('NBA'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  fullName: text('full_name').notNull(),
  team: text('team'),
  position: text('position'),
  positions: jsonb('positions'), // Array of positions for multi-position players
  age: integer('age'),
  adp: integer('adp'), // Average Draft Position
  projectedPoints: integer('projected_points'),
  injuryStatus: text('injury_status'),
  status: text('status'), // Active, Inactive, etc.
  metadata: jsonb('metadata'), // Additional player data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('idx_players_sport').on(table.sport),
  index('idx_players_team').on(table.team),
  index('idx_players_position').on(table.position),
  index('idx_players_full_name').on(table.fullName),
  index('idx_players_sleeper_id').on(table.sleeperId),
]);

// Draft Picks table - stores picks made during a draft
export const draftPicks = pgTable('draft_picks', {
  id: uuid('id').primaryKey().defaultRandom(),
  draftId: uuid('draft_id').notNull().references(() => drafts.id, { onDelete: 'cascade' }),
  playerId: uuid('player_id').notNull().references(() => players.id),
  teamNumber: integer('team_number').notNull(), // Which team made the pick (1-12)
  round: integer('round').notNull(),
  pickNumber: integer('pick_number').notNull(), // Overall pick number
  pickInRound: integer('pick_in_round').notNull(), // Pick number within the round
  isUserPick: boolean('is_user_pick').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_draft_picks_draft_id').on(table.draftId),
  index('idx_draft_picks_player_id').on(table.playerId),
  index('idx_draft_picks_team_number').on(table.teamNumber),
]);

// Draft relations
export const draftsRelations = relations(drafts, ({ one, many }) => ({
  userProfile: one(userProfile, {
    fields: [drafts.userId],
    references: [userProfile.userId],
  }),
  picks: many(draftPicks),
}));

export const draftPicksRelations = relations(draftPicks, ({ one }) => ({
  draft: one(drafts, {
    fields: [draftPicks.draftId],
    references: [drafts.id],
  }),
  player: one(players, {
    fields: [draftPicks.playerId],
    references: [players.id],
  }),
}));

export const playersRelations = relations(players, ({ many }) => ({
  draftPicks: many(draftPicks),
}));

// Type exports for use in application
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageFeedback = typeof messageFeedback.$inferSelect;
export type NewMessageFeedback = typeof messageFeedback.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type BrandAnalysis = typeof brandAnalyses.$inferSelect;
export type NewBrandAnalysis = typeof brandAnalyses.$inferInsert;
export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type DraftPick = typeof draftPicks.$inferSelect;
export type NewDraftPick = typeof draftPicks.$inferInsert;