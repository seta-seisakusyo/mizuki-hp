import { isIP } from "node:net";
import { createClient, type RedisClientType } from "redis";
import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
}

const MAX_LOCAL_KEYS = 10_000;
const localEntries = new Map<string, RateLimitEntry>();
let redisClient: RedisClientType | null = null;
let redisConnectPromise: Promise<RedisClientType> | null = null;
let redisUnavailableUntil = 0;

/**
 * Only trust the address written by our reverse proxy. Incoming
 * CF-Connecting-IP and X-Forwarded-For values are intentionally ignored.
 */
export function getTrustedClientIp(headers: Headers): string {
  const candidate = headers.get("x-real-ip")?.trim() || "";
  return isIP(candidate) ? candidate : "unknown";
}

function pruneLocalEntries(now: number): void {
  for (const [key, entry] of localEntries) {
    if (entry.resetTime <= now) localEntries.delete(key);
  }
  while (localEntries.size >= MAX_LOCAL_KEYS) {
    const oldestKey = localEntries.keys().next().value as string | undefined;
    if (!oldestKey) break;
    localEntries.delete(oldestKey);
  }
}

function checkLocal(key: string, windowMs: number, max: number): RateLimitResult {
  const now = Date.now();
  let entry = localEntries.get(key);
  if (!entry || entry.resetTime <= now) {
    if (!entry && localEntries.size >= MAX_LOCAL_KEYS) pruneLocalEntries(now);
    entry = { count: 0, resetTime: now + windowMs };
    localEntries.set(key, entry);
  }
  entry.count += 1;
  return {
    limited: entry.count > max,
    remaining: Math.max(0, max - entry.count),
    resetTime: entry.resetTime,
  };
}

async function getRedisClient(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url || Date.now() < redisUnavailableUntil) return null;

  try {
    if (!redisClient) {
      redisClient = createClient({ url });
      redisClient.on("error", () => undefined);
    }
    if (!redisClient.isOpen) {
      if (!redisConnectPromise) {
        const connectingClient = redisClient;
        redisConnectPromise = connectingClient
          .connect()
          .then(() => connectingClient)
          .finally(() => {
            redisConnectPromise = null;
          });
      }
      await redisConnectPromise;
    }
    return redisClient;
  } catch {
    redisUnavailableUntil = Date.now() + 30_000;
    redisClient?.destroy();
    redisClient = null;
    redisConnectPromise = null;
    return null;
  }
}

export async function checkRateLimitKey(
  key: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { windowMs = 60_000, max = 60 } = options;
  const namespacedKey = `mizuki:rate-limit:${key}`;
  const client = await getRedisClient();

  if (client) {
    try {
      // INCR and first-expiry assignment are one transaction, so a process
      // interruption cannot leave a permanent limiter key behind.
      const [countResult, , ttlResult] = await client
        .multi()
        .incr(namespacedKey)
        .pExpire(namespacedKey, windowMs, "NX")
        .pTTL(namespacedKey)
        .exec();
      const count = Number(countResult);
      const ttl = Number(ttlResult);
      const resetTime = Date.now() + (ttl > 0 ? ttl : windowMs);
      return {
        limited: count > max,
        remaining: Math.max(0, max - count),
        resetTime,
      };
    } catch {
      redisUnavailableUntil = Date.now() + 30_000;
      client.destroy();
      redisClient = null;
      redisConnectPromise = null;
    }
  }

  return checkLocal(namespacedKey, windowMs, max);
}

export async function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const ip = getTrustedClientIp(req.headers);
  return checkRateLimitKey(`${ip}:${req.nextUrl.pathname}`, options);
}

export async function isRateLimited(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<boolean> {
  return (await checkRateLimit(req, options)).limited;
}

export function rateLimitResponse(resetTime: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(resetTime),
      },
    }
  );
}

/** Two-step logins (password, then TOTP code) use two attempts each. */
export const LOGIN_IP_LIMIT: RateLimitOptions = {
  max: 10,
  windowMs: 15 * 60 * 1000,
};

/**
 * Per-account limit so attempts spread across many IPs still hit a ceiling.
 * Applied to every address, registered or not, to avoid revealing accounts.
 */
export const LOGIN_ACCOUNT_LIMIT: RateLimitOptions = {
  max: 10,
  windowMs: 15 * 60 * 1000,
};

export function loginAccountRateLimitKey(email: string): string {
  return `login:account:${email.trim().toLowerCase()}`;
}

export const PUBLIC_API_LIMIT: RateLimitOptions = {
  max: 60,
  windowMs: 60 * 1000,
};
