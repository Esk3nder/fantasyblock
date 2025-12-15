/**
 * Subscription Management Utility
 *
 * Handles plan checks and feature access control for FantasyBlock.
 */

import { Autumn } from 'autumn-js';
import { db } from '@/lib/db';
import { drafts } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { PLAN_LIMITS, PLAN_IDS } from '@/config/constants';

function getAutumnClient() {
  if (!process.env.AUTUMN_SECRET_KEY) {
    logger.warn('Autumn API key not configured');
    return null;
  }
  return new Autumn({
    apiKey: process.env.AUTUMN_SECRET_KEY,
  });
}

export interface UserPlan {
  planId: string;
  planName: string;
  isProPlan: boolean;
  limits: {
    draftsPerMonth: number;
    aiRecommendationsPerDraft: number;
  };
}

export interface DraftAccessResult {
  allowed: boolean;
  reason?: string;
  draftsUsedThisMonth: number;
  draftsLimit: number;
  plan: UserPlan;
}

export interface AIAccessResult {
  allowed: boolean;
  reason?: string;
  plan: UserPlan;
}

/**
 * Get the user's current plan from Autumn
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  const autumn = getAutumnClient();

  // Default to free plan if Autumn is not configured
  if (!autumn) {
    return {
      planId: PLAN_IDS.FREE,
      planName: 'Free',
      isProPlan: false,
      limits: PLAN_LIMITS.free,
    };
  }

  try {
    // Get customer's current subscription status from Autumn
    const response = await autumn.customers.get(userId);
    const customer = response.data;

    // Check if customer has a pro subscription
    // Autumn stores products/subscriptions on the customer object
    const products = customer?.products || [];
    const hasProPlan = products.some(
      (p: any) => p.id === PLAN_IDS.PRO || p.name?.toLowerCase() === 'pro'
    );

    if (hasProPlan) {
      return {
        planId: PLAN_IDS.PRO,
        planName: 'Pro',
        isProPlan: true,
        limits: PLAN_LIMITS.pro,
      };
    }

    return {
      planId: PLAN_IDS.FREE,
      planName: 'Free',
      isProPlan: false,
      limits: PLAN_LIMITS.free,
    };
  } catch (error) {
    logger.warn('Failed to fetch user plan from Autumn, defaulting to free', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Default to free plan on error
    return {
      planId: PLAN_IDS.FREE,
      planName: 'Free',
      isProPlan: false,
      limits: PLAN_LIMITS.free,
    };
  }
}

/**
 * Get the start of the current month (for counting drafts)
 */
function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Count drafts created by user this month
 */
export async function getDraftsCreatedThisMonth(userId: string): Promise<number> {
  const monthStart = getMonthStart();

  const result = await db
    .select()
    .from(drafts)
    .where(
      and(
        eq(drafts.userId, userId),
        gte(drafts.createdAt, monthStart)
      )
    );

  return result.length;
}

/**
 * Check if user can create a new draft
 */
export async function checkDraftAccess(userId: string): Promise<DraftAccessResult> {
  const plan = await getUserPlan(userId);
  const draftsUsedThisMonth = await getDraftsCreatedThisMonth(userId);

  // Unlimited drafts for pro plan
  if (plan.limits.draftsPerMonth === -1) {
    return {
      allowed: true,
      draftsUsedThisMonth,
      draftsLimit: -1,
      plan,
    };
  }

  // Check if user has reached their limit
  if (draftsUsedThisMonth >= plan.limits.draftsPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${plan.limits.draftsPerMonth} draft(s). Upgrade to Pro for unlimited drafts.`,
      draftsUsedThisMonth,
      draftsLimit: plan.limits.draftsPerMonth,
      plan,
    };
  }

  return {
    allowed: true,
    draftsUsedThisMonth,
    draftsLimit: plan.limits.draftsPerMonth,
    plan,
  };
}

/**
 * Check if user can use AI recommendations
 */
export async function checkAIAccess(userId: string): Promise<AIAccessResult> {
  const plan = await getUserPlan(userId);

  // Pro plan has unlimited AI recommendations
  if (plan.isProPlan) {
    return {
      allowed: true,
      plan,
    };
  }

  // Free plan has no AI recommendations
  return {
    allowed: false,
    reason: 'AI draft recommendations are available on the Pro plan. Upgrade to get intelligent player suggestions.',
    plan,
  };
}

/**
 * Get subscription status summary for the user
 */
export async function getSubscriptionStatus(userId: string) {
  const plan = await getUserPlan(userId);
  const draftsUsedThisMonth = await getDraftsCreatedThisMonth(userId);

  return {
    plan: {
      id: plan.planId,
      name: plan.planName,
      isPro: plan.isProPlan,
    },
    usage: {
      draftsThisMonth: draftsUsedThisMonth,
      draftsLimit: plan.limits.draftsPerMonth,
      draftsRemaining: plan.limits.draftsPerMonth === -1
        ? -1
        : Math.max(0, plan.limits.draftsPerMonth - draftsUsedThisMonth),
    },
    features: {
      aiRecommendations: plan.isProPlan,
      unlimitedDrafts: plan.isProPlan,
    },
  };
}
