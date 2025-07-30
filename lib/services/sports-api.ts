import { ApiError } from '../api-errors';

const BASE_URL = 'https://api.balldontlie.io/v1';

interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  weight: string;
  jersey_number: string;
  college: string;
  country: string;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: Team;
}

interface Team {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

interface Game {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team: Team;
  visitor_team: Team;
  home_team_score: number;
  visitor_team_score: number;
}

interface PlayerStats {
  id: number;
  min: string;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  pts: number;
  player: Player;
  team: Team;
  game: Game;
}

interface ApiResponse<T> {
  data: T[];
  meta: {
    next_cursor?: number;
    per_page: number;
  };
}

export class SportsApiService {
  private apiKey: string;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new ApiError('Ball Don\'t Lie API key is required', 500);
    }
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            url.searchParams.append(key, value.join(','));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new ApiError('Invalid API key', 401);
        }
        if (response.status === 429) {
          throw new ApiError('Rate limit exceeded', 429);
        }
        if (response.status === 404) {
          throw new ApiError('Resource not found', 404);
        }
        throw new ApiError(`API request failed: ${response.statusText}`, response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ApiError(`Network error: ${error.message}`, 500);
      }
      throw new ApiError('Unknown error occurred', 500);
    }
  }

  async getTeams(params?: {
    division?: string;
    conference?: string;
  }): Promise<Team[]> {
    const response = await this.makeRequest<Team>('/teams', params);
    return response.data;
  }

  async getPlayers(params?: {
    search?: string;
    team_ids?: number[];
    first_name?: string;
    last_name?: string;
    cursor?: number;
    per_page?: number;
  }): Promise<{ data: Player[]; meta: { next_cursor?: number; per_page: number } }> {
    const response = await this.makeRequest<Player>('/players', params);
    return response;
  }

  async getGames(params?: {
    dates?: string[];
    seasons?: number[];
    team_ids?: number[];
    postseason?: boolean;
    cursor?: number;
    per_page?: number;
  }): Promise<{ data: Game[]; meta: { next_cursor?: number; per_page: number } }> {
    const response = await this.makeRequest<Game>('/games', params);
    return response;
  }

  async getPlayerStats(params?: {
    player_ids?: number[];
    game_ids?: number[];
    seasons?: number[];
    cursor?: number;
    per_page?: number;
  }): Promise<{ data: PlayerStats[]; meta: { next_cursor?: number; per_page: number } }> {
    const response = await this.makeRequest<PlayerStats>('/stats', params);
    return response;
  }

  async getPlayerById(id: number): Promise<Player | null> {
    try {
      const response = await this.getPlayers({ cursor: 0, per_page: 100 });
      const player = response.data.find(p => p.id === id);
      return player || null;
    } catch (error) {
      throw error;
    }
  }

  async getTeamById(id: number): Promise<Team | null> {
    try {
      const teams = await this.getTeams();
      const team = teams.find(t => t.id === id);
      return team || null;
    } catch (error) {
      throw error;
    }
  }
}

let sportsApiService: SportsApiService | null = null;

export function getSportsApiService(): SportsApiService {
  if (!sportsApiService) {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new ApiError('BALLDONTLIE_API_KEY environment variable is not set', 500);
    }
    sportsApiService = new SportsApiService(apiKey);
  }
  return sportsApiService;
}