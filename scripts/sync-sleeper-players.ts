/**
 * Sync NBA Players from Sleeper API
 *
 * Run with: npx tsx scripts/sync-sleeper-players.ts
 *
 * Sleeper API docs: https://docs.sleeper.app/
 * NBA players endpoint: GET https://api.sleeper.app/v1/players/nba
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { players } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';

interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  team: string | null;
  position: string | null;
  fantasy_positions?: string[];
  age?: number;
  injury_status?: string;
  status?: string;
  years_exp?: number;
  height?: string;
  weight?: string;
  college?: string;
  metadata?: Record<string, unknown>;
}

async function fetchSleeperPlayers(sport: 'nba' | 'nfl' = 'nba'): Promise<Record<string, SleeperPlayer>> {
  console.log(`Fetching ${sport.toUpperCase()} players from Sleeper API...`);

  const response = await fetch(`${SLEEPER_BASE_URL}/players/${sport}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch players: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`Fetched ${Object.keys(data).length} players from Sleeper`);

  return data;
}

async function syncPlayers(sport: 'NBA' | 'NFL' = 'NBA') {
  const sleeperSport = sport.toLowerCase() as 'nba' | 'nfl';
  const sleeperPlayers = await fetchSleeperPlayers(sleeperSport);

  const playerEntries = Object.entries(sleeperPlayers);
  console.log(`Processing ${playerEntries.length} players...`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  // Process in batches to avoid memory issues
  const BATCH_SIZE = 100;

  for (let i = 0; i < playerEntries.length; i += BATCH_SIZE) {
    const batch = playerEntries.slice(i, i + BATCH_SIZE);

    for (const [sleeperId, player] of batch) {
      // Skip players without a name
      if (!player.first_name && !player.last_name) {
        skipped++;
        continue;
      }

      const fullName = player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim();

      // Skip players with no full name
      if (!fullName) {
        skipped++;
        continue;
      }

      // Check if player exists
      const [existing] = await db
        .select()
        .from(players)
        .where(eq(players.sleeperId, sleeperId));

      const playerData = {
        sleeperId,
        sport,
        firstName: player.first_name || null,
        lastName: player.last_name || null,
        fullName,
        team: player.team || null,
        position: player.position || null,
        positions: player.fantasy_positions || null,
        age: player.age || null,
        injuryStatus: player.injury_status || null,
        status: player.status || null,
        metadata: {
          yearsExp: player.years_exp,
          height: player.height,
          weight: player.weight,
          college: player.college,
        },
      };

      if (existing) {
        // Update existing player
        await db
          .update(players)
          .set(playerData)
          .where(eq(players.sleeperId, sleeperId));
        updated++;
      } else {
        // Insert new player
        await db.insert(players).values(playerData);
        inserted++;
      }
    }

    // Progress update
    const processed = Math.min(i + BATCH_SIZE, playerEntries.length);
    console.log(`Processed ${processed}/${playerEntries.length} players...`);
  }

  console.log('\n--- Sync Complete ---');
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total processed: ${inserted + updated + skipped}`);
}

// Main execution
async function main() {
  console.log('=== Sleeper Player Sync ===\n');

  try {
    // Check database connection
    console.log('Checking database connection...');
    await db.select().from(players).limit(1);
    console.log('Database connected.\n');

    // Sync NBA players
    await syncPlayers('NBA');

    console.log('\nSync completed successfully!');
  } catch (error) {
    console.error('Error syncing players:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
