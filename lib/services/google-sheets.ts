export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  rank: number;
  projected: number;
  adp?: string; // Keep as string for "3.12" format
  byeWeek?: number;
  status?: string;
  lastUpdated?: string;
}

export interface Team {
  teamCode: string;
  fullName: string;
  conference: string;
  division: string;
  byeWeek: number;
}

export interface PlayerStats {
  playerId: string;
  week: number;
  passingYards?: number;
  passingTDs?: number;
  rushingYards?: number;
  rushingTDs?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
  fantasyPoints: number;
}

export interface ScoringSetting {
  statType: string;
  points: number;
}

function parseCSV(csv: string): any[] {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      return obj;
    });
}

export async function fetchPlayersFromSheet(): Promise<Player[]> {
  const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
  
  if (!sheetId) {
    console.error('Google Sheet ID not configured');
    return [];
  }

  try {
    // Use gid=0 for the first sheet, change if your Players sheet has a different gid
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes in Next.js
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch sheet data');
    }
    
    const csvText = await response.text();
    const data = parseCSV(csvText);
    
    // Transform to Player format
    return data.map((row, index) => ({
      id: row.ID || String(index + 1),
      name: row.Name || row.name || '',
      position: row.Position || row.position || '',
      team: row.Team || row.team || '',
      rank: parseInt(row.Rank || row.rank) || index + 1,
      projected: parseFloat(row.ProjectedPoints || row.projected) || 0,
      adp: row.ADP || undefined, // Keep as string for "3.12" format
      byeWeek: row.ByeWeek ? parseInt(row.ByeWeek) : undefined,
      status: row.Status || 'Active',
      lastUpdated: row.LastUpdated
    }));
  } catch (error) {
    console.error('Error fetching players from Google Sheet:', error);
    
    // Return mock data as fallback
    return [
      { id: '1', name: 'Christian McCaffrey', position: 'RB', team: 'SF', rank: 1, projected: 285 },
      { id: '2', name: 'Austin Ekeler', position: 'RB', team: 'LAC', rank: 2, projected: 265 },
      { id: '3', name: 'Josh Allen', position: 'QB', team: 'BUF', rank: 3, projected: 315 },
      { id: '4', name: 'Cooper Kupp', position: 'WR', team: 'LAR', rank: 4, projected: 245 },
      { id: '5', name: 'Derrick Henry', position: 'RB', team: 'TEN', rank: 5, projected: 255 },
    ];
  }
}

// Fetch teams data
export async function fetchTeams(): Promise<Team[]> {
  const data = await fetchSheetByName('Teams');
  return data.map(row => ({
    teamCode: row.TeamCode || '',
    fullName: row.FullName || '',
    conference: row.Conference || '',
    division: row.Division || '',
    byeWeek: parseInt(row.ByeWeek) || 0
  }));
}

// Fetch scoring settings
export async function fetchScoringSettings(): Promise<ScoringSetting[]> {
  const data = await fetchSheetByName('ScoringSettings');
  return data.map(row => ({
    statType: row.StatType || '',
    points: parseFloat(row.Points) || 0
  }));
}

// Fetch player stats (for a specific week or all)
export async function fetchPlayerStats(week?: number): Promise<PlayerStats[]> {
  const data = await fetchSheetByName('PlayerStats');
  const stats = data.map(row => ({
    playerId: row.PlayerID || '',
    week: parseInt(row.Week) || 0,
    passingYards: row.PassingYards ? parseInt(row.PassingYards) : undefined,
    passingTDs: row.PassingTDs ? parseInt(row.PassingTDs) : undefined,
    rushingYards: row.RushingYards ? parseInt(row.RushingYards) : undefined,
    rushingTDs: row.RushingTDs ? parseInt(row.RushingTDs) : undefined,
    receptions: row.Receptions ? parseInt(row.Receptions) : undefined,
    receivingYards: row.ReceivingYards ? parseInt(row.ReceivingYards) : undefined,
    receivingTDs: row.ReceivingTDs ? parseInt(row.ReceivingTDs) : undefined,
    fantasyPoints: parseFloat(row.FantasyPoints) || 0
  }));
  
  if (week !== undefined) {
    return stats.filter(s => s.week === week);
  }
  return stats;
}

// Optional: Fetch from a specific sheet tab by name
export async function fetchSheetByName(sheetName: string): Promise<any[]> {
  const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
  
  if (!sheetId) {
    console.error('Google Sheet ID not configured');
    return [];
  }

  try {
    // For named sheets, you'll need to know the gid (sheet ID within the spreadsheet)
    // You can find this in the URL when you select the sheet tab
    const gidMap: Record<string, string> = {
      'Players': '0',
      'PlayerStats': '1', // Update with actual gid
      'Teams': '2', // Update with actual gid
      'ScoringSettings': '3', // Update with actual gid
    };
    
    const gid = gidMap[sheetName] || '0';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sheetName} sheet data`);
    }
    
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error fetching ${sheetName} from Google Sheet:`, error);
    return [];
  }
}