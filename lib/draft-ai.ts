/**
 * AI Draft Recommendations Engine
 *
 * Generates intelligent player recommendations for fantasy drafts
 * using AI providers (OpenAI, Anthropic, etc.)
 */

import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { logger } from '@/lib/logger';
import type { Player, Draft, DraftPick } from '@/lib/db/schema';

export interface DraftContext {
  draft: Draft;
  picks: (DraftPick & { player: Player | null })[];
  availablePlayers: Player[];
  userRoster: Player[];
  currentPick: number;
  userTeamNumber: number;
}

export interface PlayerRecommendation {
  playerId: string;
  playerName: string;
  position: string;
  team: string | null;
  reasoning: string;
  score: number; // 0-100 confidence score
  tags: string[]; // e.g., "best available", "positional need", "value pick"
}

export interface RecommendationsResult {
  recommendations: PlayerRecommendation[];
  strategy: string;
  rosterAnalysis: {
    strengths: string[];
    needs: string[];
  };
}

// NBA fantasy positions and typical roster construction
const NBA_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL'];
const IDEAL_ROSTER_COMPOSITION = {
  PG: 2,
  SG: 2,
  SF: 2,
  PF: 2,
  C: 2,
  // G, F, UTIL are flex positions
};

/**
 * Get AI provider based on environment configuration
 */
function getAIProvider() {
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      model: anthropic('claude-3-5-sonnet-20241022'),
      provider: 'anthropic',
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      model: openai('gpt-4o-mini'),
      provider: 'openai',
    };
  }
  return null;
}

/**
 * Analyze current roster composition
 */
function analyzeRoster(roster: Player[]): { strengths: string[]; needs: string[] } {
  const positionCounts: Record<string, number> = {};

  for (const player of roster) {
    const pos = player.position || 'UTIL';
    positionCounts[pos] = (positionCounts[pos] || 0) + 1;
  }

  const strengths: string[] = [];
  const needs: string[] = [];

  for (const [pos, ideal] of Object.entries(IDEAL_ROSTER_COMPOSITION)) {
    const count = positionCounts[pos] || 0;
    if (count >= ideal) {
      strengths.push(`${pos} (${count})`);
    } else if (count < ideal - 1) {
      needs.push(`${pos} (have ${count}, need ${ideal})`);
    }
  }

  if (needs.length === 0) {
    needs.push('Roster is well-balanced');
  }

  return { strengths, needs };
}

/**
 * Build the prompt for AI recommendations
 */
function buildRecommendationPrompt(context: DraftContext): string {
  const { draft, availablePlayers, userRoster, currentPick } = context;

  // Get top available players by ADP
  const topAvailable = availablePlayers
    .filter(p => p.adp !== null)
    .sort((a, b) => (a.adp || 999) - (b.adp || 999))
    .slice(0, 30);

  const rosterAnalysis = analyzeRoster(userRoster);

  const prompt = `You are an expert NBA fantasy basketball analyst. Analyze this draft situation and recommend the best picks.

DRAFT CONTEXT:
- Sport: ${draft.sport}
- Draft Type: ${draft.draftType}
- Teams: ${draft.numTeams}
- User's Draft Position: ${draft.draftPosition}
- Current Overall Pick: ${currentPick}
- Scoring Type: ${draft.scoringType}

USER'S CURRENT ROSTER (${userRoster.length} players):
${userRoster.length > 0
      ? userRoster.map(p => `- ${p.fullName} (${p.position}) - ${p.team}`).join('\n')
      : '- No players drafted yet'
    }

ROSTER ANALYSIS:
- Strengths: ${rosterAnalysis.strengths.join(', ') || 'None yet'}
- Needs: ${rosterAnalysis.needs.join(', ')}

TOP 30 AVAILABLE PLAYERS (sorted by ADP):
${topAvailable.map((p, i) => `${i + 1}. ${p.fullName} (${p.position}) - ${p.team} - ADP: ${p.adp}`).join('\n')}

TASK:
Recommend the TOP 5 best players to draft right now. Consider:
1. Best Player Available (BPA) strategy
2. Positional needs and roster construction
3. Value relative to ADP (is anyone falling?)
4. Late-round strategy if applicable

For each recommendation, provide:
- Player name and position
- A brief reasoning (1-2 sentences)
- Confidence score (0-100)
- Tags: "best available", "positional need", "value pick", "sleeper", "safe floor", "high ceiling"

Respond in JSON format:
{
  "recommendations": [
    {
      "playerName": "Player Name",
      "position": "PG",
      "reasoning": "Brief explanation",
      "score": 85,
      "tags": ["best available", "positional need"]
    }
  ],
  "strategy": "One sentence overall strategy recommendation",
  "rosterNeeds": ["PG", "C"]
}`;

  return prompt;
}

/**
 * Parse AI response into structured recommendations
 */
function parseAIResponse(
  response: string,
  availablePlayers: Player[]
): RecommendationsResult {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);

    // Map recommendations to actual players
    const recommendations: PlayerRecommendation[] = [];

    for (const rec of parsed.recommendations || []) {
      // Find matching player
      const player = availablePlayers.find(
        p => p.fullName.toLowerCase().includes(rec.playerName.toLowerCase()) ||
          rec.playerName.toLowerCase().includes(p.fullName.toLowerCase())
      );

      if (player) {
        recommendations.push({
          playerId: player.id,
          playerName: player.fullName,
          position: player.position || rec.position,
          team: player.team,
          reasoning: rec.reasoning,
          score: rec.score || 75,
          tags: rec.tags || [],
        });
      }
    }

    // Ensure we have at least some recommendations
    if (recommendations.length === 0) {
      // Fallback to top ADP players
      const topPlayers = availablePlayers
        .filter(p => p.adp !== null)
        .sort((a, b) => (a.adp || 999) - (b.adp || 999))
        .slice(0, 5);

      for (const player of topPlayers) {
        recommendations.push({
          playerId: player.id,
          playerName: player.fullName,
          position: player.position || 'UTIL',
          team: player.team,
          reasoning: 'Best available player by ADP',
          score: 70,
          tags: ['best available'],
        });
      }
    }

    return {
      recommendations: recommendations.slice(0, 5),
      strategy: parsed.strategy || 'Draft the best available player',
      rosterAnalysis: {
        strengths: [],
        needs: parsed.rosterNeeds || [],
      },
    };
  } catch (error) {
    logger.error('Failed to parse AI recommendations response', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return fallback recommendations
    const topPlayers = availablePlayers
      .filter(p => p.adp !== null)
      .sort((a, b) => (a.adp || 999) - (b.adp || 999))
      .slice(0, 5);

    return {
      recommendations: topPlayers.map(player => ({
        playerId: player.id,
        playerName: player.fullName,
        position: player.position || 'UTIL',
        team: player.team,
        reasoning: 'Best available player by ADP',
        score: 70,
        tags: ['best available'],
      })),
      strategy: 'Draft the best available player',
      rosterAnalysis: {
        strengths: [],
        needs: [],
      },
    };
  }
}

/**
 * Generate AI draft recommendations
 */
export async function generateRecommendations(
  context: DraftContext
): Promise<RecommendationsResult> {
  const provider = getAIProvider();

  if (!provider) {
    logger.warn('No AI provider configured, using fallback recommendations');
    return getFallbackRecommendations(context);
  }

  const prompt = buildRecommendationPrompt(context);

  try {
    logger.info('Generating AI draft recommendations', {
      provider: provider.provider,
      draftId: context.draft.id,
      currentPick: context.currentPick,
      availablePlayers: context.availablePlayers.length,
    });

    const { text } = await generateText({
      model: provider.model,
      prompt,
      maxTokens: 1000,
      temperature: 0.7,
    });

    const result = parseAIResponse(text, context.availablePlayers);

    logger.info('AI recommendations generated', {
      draftId: context.draft.id,
      recommendationCount: result.recommendations.length,
    });

    return result;
  } catch (error) {
    logger.error('AI recommendation generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      draftId: context.draft.id,
    });

    return getFallbackRecommendations(context);
  }
}

/**
 * Fallback recommendations when AI is unavailable
 */
function getFallbackRecommendations(context: DraftContext): RecommendationsResult {
  const { availablePlayers, userRoster } = context;
  const rosterAnalysis = analyzeRoster(userRoster);

  // Sort by ADP
  const sortedPlayers = [...availablePlayers]
    .filter(p => p.adp !== null)
    .sort((a, b) => (a.adp || 999) - (b.adp || 999));

  // Get top 5
  const recommendations: PlayerRecommendation[] = sortedPlayers
    .slice(0, 5)
    .map((player, index) => ({
      playerId: player.id,
      playerName: player.fullName,
      position: player.position || 'UTIL',
      team: player.team,
      reasoning: index === 0
        ? 'Best available player by ADP'
        : `Strong value at pick ${context.currentPick}`,
      score: 80 - index * 5,
      tags: index === 0 ? ['best available'] : ['value pick'],
    }));

  return {
    recommendations,
    strategy: 'Draft the best available player based on ADP rankings',
    rosterAnalysis,
  };
}
