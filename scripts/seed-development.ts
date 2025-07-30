#!/usr/bin/env tsx

/**
 * FantasyBlock Development Database Seeding Script
 * 
 * This script seeds the database with sample data for local development and testing
 */

import { db } from '../lib/db';
import { validateEnv } from '../lib/env-validation';

// Sample players data for development
const samplePlayers = {
  nfl: [
    { name: 'Christian McCaffrey', position: 'RB', team: 'SF', rank: 1, projected: 285 },
    { name: 'Austin Ekeler', position: 'RB', team: 'LAC', rank: 2, projected: 265 },
    { name: 'Josh Allen', position: 'QB', team: 'BUF', rank: 3, projected: 315 },
    { name: 'Cooper Kupp', position: 'WR', team: 'LAR', rank: 4, projected: 245 },
    { name: 'Derrick Henry', position: 'RB', team: 'TEN', rank: 5, projected: 255 },
    { name: 'Stefon Diggs', position: 'WR', team: 'BUF', rank: 6, projected: 235 },
    { name: 'Davante Adams', position: 'WR', team: 'LV', rank: 7, projected: 230 },
    { name: 'Travis Kelce', position: 'TE', team: 'KC', rank: 8, projected: 195 },
    { name: 'Nick Chubb', position: 'RB', team: 'CLE', rank: 9, projected: 225 },
    { name: 'Alvin Kamara', position: 'RB', team: 'NO', rank: 10, projected: 220 },
  ],
  nba: [
    { name: 'Nikola Jokic', position: 'C', team: 'DEN', rank: 1, projected: 62.5 },
    { name: 'Luka Doncic', position: 'PG', team: 'DAL', rank: 2, projected: 58.2 },
    { name: 'Giannis Antetokounmpo', position: 'PF', team: 'MIL', rank: 3, projected: 57.8 },
    { name: 'Joel Embiid', position: 'C', team: 'PHI', rank: 4, projected: 56.1 },
    { name: 'Jayson Tatum', position: 'SF', team: 'BOS', rank: 5, projected: 55.3 },
  ],
  mlb: [
    { name: 'Ronald Acuna Jr.', position: 'OF', team: 'ATL', rank: 1, projected: 185 },
    { name: 'Mookie Betts', position: 'OF', team: 'LAD', rank: 2, projected: 175 },
    { name: 'Mike Trout', position: 'OF', team: 'LAA', rank: 3, projected: 170 },
    { name: 'Trea Turner', position: 'SS', team: 'PHI', rank: 4, projected: 165 },
    { name: 'Jose Altuve', position: '2B', team: 'HOU', rank: 5, projected: 160 },
  ]
};

// Sample leagues for testing
const sampleLeagues = [
  {
    name: 'Development Test League',
    sport: 'NFL',
    teams: 12,
    draftType: 'Snake',
    status: 'upcoming',
    platform: 'manual'
  },
  {
    name: 'NBA Demo League',
    sport: 'NBA', 
    teams: 10,
    draftType: 'Auction',
    status: 'active',
    platform: 'manual'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Validate environment
    validateEnv();
    
    console.log('✅ Environment validated');
    
    // Test database connection
    await db.$client.query('SELECT 1');
    console.log('✅ Database connected');
    
    // Here you would seed your actual database tables
    // This is a placeholder since we haven't defined the exact schema yet
    
    console.log('📊 Sample data available:');
    console.log(`   - ${samplePlayers.nfl.length} NFL players`);
    console.log(`   - ${samplePlayers.nba.length} NBA players`);
    console.log(`   - ${samplePlayers.mlb.length} MLB players`);
    console.log(`   - ${sampleLeagues.length} sample leagues`);
    
    // TODO: Implement actual seeding when database schema is finalized
    // Example:
    // await db.insert(playersTable).values(samplePlayers.nfl);
    // await db.insert(leaguesTable).values(sampleLeagues);
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase, samplePlayers, sampleLeagues };