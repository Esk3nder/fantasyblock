import { pgTable, text, timestamp, uuid, boolean, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['user', 'assistant']);
export const themeEnum = pgEnum('theme', ['light', 'dark']);
export const conferenceEnum = pgEnum('conference', ['East', 'West']);
export const divisionEnum = pgEnum('division', ['Atlantic', 'Central', 'Southeast', 'Northwest', 'Pacific', 'Southwest']);

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

// NBA Teams table
export const nbaTeams = pgTable('nba_teams', {
  id: integer('id').primaryKey(),
  conference: conferenceEnum('conference').notNull(),
  division: divisionEnum('division').notNull(),
  city: text('city').notNull(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  abbreviation: text('abbreviation').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// NBA Players table
export const nbaPlayers = pgTable('nba_players', {
  id: integer('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  position: text('position'),
  height: text('height'),
  weight: text('weight'),
  jerseyNumber: text('jersey_number'),
  college: text('college'),
  country: text('country'),
  draftYear: integer('draft_year'),
  draftRound: integer('draft_round'),
  draftNumber: integer('draft_number'),
  teamId: integer('team_id').references(() => nbaTeams.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// NBA Games table
export const nbaGames = pgTable('nba_games', {
  id: integer('id').primaryKey(),
  date: text('date').notNull(),
  season: integer('season').notNull(),
  status: text('status'),
  period: integer('period'),
  time: text('time'),
  postseason: boolean('postseason').default(false),
  homeTeamId: integer('home_team_id').notNull().references(() => nbaTeams.id),
  visitorTeamId: integer('visitor_team_id').notNull().references(() => nbaTeams.id),
  homeTeamScore: integer('home_team_score'),
  visitorTeamScore: integer('visitor_team_score'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// NBA Player Stats table
export const nbaPlayerStats = pgTable('nba_player_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: integer('player_id').notNull().references(() => nbaPlayers.id),
  gameId: integer('game_id').notNull().references(() => nbaGames.id),
  teamId: integer('team_id').notNull().references(() => nbaTeams.id),
  minutes: text('minutes'),
  fgm: integer('fgm'),
  fga: integer('fga'),
  fgPct: text('fg_pct'),
  fg3m: integer('fg3m'),
  fg3a: integer('fg3a'),
  fg3Pct: text('fg3_pct'),
  ftm: integer('ftm'),
  fta: integer('fta'),
  ftPct: text('ft_pct'),
  oreb: integer('oreb'),
  dreb: integer('dreb'),
  reb: integer('reb'),
  ast: integer('ast'),
  stl: integer('stl'),
  blk: integer('blk'),
  turnover: integer('turnover'),
  pf: integer('pf'),
  pts: integer('pts'),
  createdAt: timestamp('created_at').defaultNow(),
});

// NBA Relations
export const nbaTeamsRelations = relations(nbaTeams, ({ many }) => ({
  players: many(nbaPlayers),
  homeGames: many(nbaGames, { relationName: 'homeTeam' }),
  awayGames: many(nbaGames, { relationName: 'visitorTeam' }),
  stats: many(nbaPlayerStats),
}));

export const nbaPlayersRelations = relations(nbaPlayers, ({ one, many }) => ({
  team: one(nbaTeams, {
    fields: [nbaPlayers.teamId],
    references: [nbaTeams.id],
  }),
  stats: many(nbaPlayerStats),
}));

export const nbaGamesRelations = relations(nbaGames, ({ one, many }) => ({
  homeTeam: one(nbaTeams, {
    fields: [nbaGames.homeTeamId],
    references: [nbaTeams.id],
    relationName: 'homeTeam',
  }),
  visitorTeam: one(nbaTeams, {
    fields: [nbaGames.visitorTeamId],
    references: [nbaTeams.id],
    relationName: 'visitorTeam',
  }),
  stats: many(nbaPlayerStats),
}));

export const nbaPlayerStatsRelations = relations(nbaPlayerStats, ({ one }) => ({
  player: one(nbaPlayers, {
    fields: [nbaPlayerStats.playerId],
    references: [nbaPlayers.id],
  }),
  game: one(nbaGames, {
    fields: [nbaPlayerStats.gameId],
    references: [nbaGames.id],
  }),
  team: one(nbaTeams, {
    fields: [nbaPlayerStats.teamId],
    references: [nbaTeams.id],
  }),
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

// NBA Type exports
export type NbaTeam = typeof nbaTeams.$inferSelect;
export type NewNbaTeam = typeof nbaTeams.$inferInsert;
export type NbaPlayer = typeof nbaPlayers.$inferSelect;
export type NewNbaPlayer = typeof nbaPlayers.$inferInsert;
export type NbaGame = typeof nbaGames.$inferSelect;
export type NewNbaGame = typeof nbaGames.$inferInsert;
export type NbaPlayerStats = typeof nbaPlayerStats.$inferSelect;
export type NewNbaPlayerStats = typeof nbaPlayerStats.$inferInsert;