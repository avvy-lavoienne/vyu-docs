// Auth middleware helper functions
import { supabase } from '@/lib/supabase/client';

/**
 * Check if user has enough credits
 */
export async function hasCredits(email, amount = 1) {
  const { data, error } = await supabase
    .from('profiles')
    .select('credits_remaining, subscription_tier')
    .eq('email', email)
    .single();

  if (error || !data) return false;
  
  // Enterprise has unlimited
  if (data.subscription_tier === 'enterprise') return true;
  
  return data.credits_remaining >= amount;
}

/**
 * Deduct credits from user
 */
export async function deductCredits(email, amount = 1) {
  const { data, error } = await supabase.rpc('deduct_credits', {
    user_email: email,
    amount,
  });

  return !error && data;
}

/**
 * Check if user's subscription is active
 */
export async function isSubscriptionActive(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier, trial_ends_at')
    .eq('email', email)
    .single();

  if (error || !data) return false;

  // Free tier is always "active"
  if (data.subscription_tier === 'free') return true;

  // Check if trial is still valid
  if (data.trial_ends_at) {
    const trialEnd = new Date(data.trial_ends_at);
    const now = new Date();
    return now < trialEnd;
  }

  // Paid tiers are active if they have the tier
  return ['pro', 'enterprise'].includes(data.subscription_tier);
}

/**
 * Get user's tier limits
 */
export function getTierLimits(tier) {
  const limits = {
    free: {
      monthly_repos: 5,
      features: ['readme', 'architecture', 'setup'],
      api_calls: 0,
    },
    pro: {
      monthly_repos: 50,
      features: ['readme', 'architecture', 'setup', 'design', 'clone_prompts', 'diagrams'],
      api_calls: 1000,
    },
    enterprise: {
      monthly_repos: 999999,
      features: ['readme', 'architecture', 'setup', 'design', 'clone_prompts', 'diagrams'],
      api_calls: 999999,
    },
  };

  return limits[tier] || limits.free;
}

/**
 * Validate API key
 */
export async function validateApiKey(apiKey) {
  if (!apiKey) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Log API usage
 */
export async function logApiUsage(userId, apiKey, endpoint, method, statusCode, responseTime) {
  await supabase.from('api_usage').insert({
    user_id: userId,
    api_key: apiKey,
    endpoint,
    method,
    status_code: statusCode,
    response_time: responseTime,
  });
}