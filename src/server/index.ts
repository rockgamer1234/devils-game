import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort, redis, reddit, context } from '@devvit/web/server';
import { forms } from './routes/forms.js';
import { menu } from './routes/menu.js';
import { triggers } from './routes/triggers.js';

const app = new Hono();


app.use('/api/*', async (c, next) => {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
  await next();
});

// Helper for Daily Leaderboard Keys
function getDailyKey(): string {
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `leaderboard:${yyyy}-${mm}-${dd}`;
}

async function getUsername(c: any): Promise<string> {
  try {
    const name = await reddit.getCurrentUsername();
    if (name) return name;
  } catch(e) {}
  

  const headerName = c.req.header('devvit-username');
  if (headerName) return headerName;
  
  return "Guest_Player"; 
}

// 1. GET: Today's Daily Top Players
app.get('/api/daily-leaderboard', async (c) => {
  try {
    const todayKey = getDailyKey();
    let topPlayers: any[] = [];
    
    try {
      
      topPlayers = await redis.zRange(todayKey, 0, 9, { by: 'rank', reverse: true, withScores: true } as any) as any[];
    } catch (e) {
      console.warn("[API] Daily Leaderboard DB error:", e);
    }
    
    if (!topPlayers || !Array.isArray(topPlayers)) topPlayers = [];

    const results = topPlayers.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return {
          name: item.member || "Anonymous",
          score: typeof item.score === 'number' ? item.score : 0,
          coins: 0
        };
      } else {
        return {
          name: String(item),
          score: 0,
          coins: 0
        };
      }
    });

    return c.json(results);
  } catch (error) {
    return c.json([]);
  }
});

// 2. GET: All-Time Top Players
app.get('/api/leaderboard', async (c) => {
  try {
    const allTimeKey = 'leaderboard:all-time';
    let topPlayers: any[] = [];
    
    try {
      topPlayers = await redis.zRange(allTimeKey, 0, 9, { by: 'rank', reverse: true, withScores: true } as any) as any[];
    } catch (e) {
      console.warn("[API] All-time Leaderboard DB error:", e);
    }

    if (!topPlayers || !Array.isArray(topPlayers)) topPlayers = [];

    const results = topPlayers.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return {
          name: item.member || "Anonymous",
          score: typeof item.score === 'number' ? item.score : 0,
          coins: 0
        };
      } else {
        return {
          name: String(item),
          score: 0,
          coins: 0
        };
      }
    });

    return c.json(results);
  } catch (error) {
    return c.json([]);
  }
});

// 3. POST: Submit Score
app.post('/api/leaderboard', async (c) => {
  try {
    const body = await c.req.json();
    const score = Number(body.score);
    const coinsEarned = Number(body.coins) || 0; 
    const currentUser = await getUsername(c); 
    if (isNaN(score)) return c.json({ error: 'Invalid parameters' }, 400);

   
    try {
      if (coinsEarned > 0) {
        await redis.hIncrBy('user_wallets', currentUser, coinsEarned);
      }
    } catch (e) {
      console.warn("Wallet DB Error:", e);
    }

    const todayKey = getDailyKey();
    const allTimeKey = 'leaderboard:all-time';

    try {
      const oldDailyStr = await redis.zScore(todayKey, currentUser);
      const oldDaily = oldDailyStr ? Number(oldDailyStr) : 0;

      if (score > oldDaily) {
        await redis.zAdd(todayKey, { member: currentUser, score: score });
        await redis.expire(todayKey, 172800);
      }

      const oldAllTimeStr = await redis.zScore(allTimeKey, currentUser);
      const oldAllTime = oldAllTimeStr ? Number(oldAllTimeStr) : 0;

      if (score > oldAllTime) {
        await redis.zAdd(allTimeKey, { member: currentUser, score: score });
      }
    } catch (redisError) {}

    let dailyBest = score;
    try {
      const dailyScoreStr = await redis.zScore(todayKey, currentUser);
      dailyBest = dailyScoreStr ? Number(dailyScoreStr) : score;
    } catch (e) {}

    let allTimeBest = score;
    try {
      const allTimeScoreStr = await redis.zScore(allTimeKey, currentUser);
      allTimeBest = allTimeScoreStr ? Number(allTimeScoreStr) : score;
    } catch (e) {}

    let rank: number | null = null;
    try {
      const rankAsc = await redis.zRank(allTimeKey, currentUser);
      if (rankAsc !== null && rankAsc !== undefined) {
        const total = await redis.zCard(allTimeKey);
        rank = total - rankAsc;
      }
    } catch (e) {}

    return c.json({ 
      success: true, 
      user: currentUser, 
      score: dailyBest, 
      allTimeBest: allTimeBest, 
      rank: rank 
    });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 4. GET: Player Profile Statistics
app.get('/api/me', async (c) => {
  try {
    const username = await getUsername(c);
    const todayKey = getDailyKey();
    const allTimeKey = 'leaderboard:all-time';

    let dailyBest = 0;
    try {
      const dailyScoreStr = await redis.zScore(todayKey, username);
      dailyBest = dailyScoreStr ? Number(dailyScoreStr) : 0;
    } catch (e) {}

    let allTimeBest = 0;
    try {
      const allTimeScoreStr = await redis.zScore(allTimeKey, username);
      allTimeBest = allTimeScoreStr ? Number(allTimeScoreStr) : 0;
    } catch (e) {}

    let rank: number | null = null;
    try {
      const rankAsc = await redis.zRank(allTimeKey, username);
      if (rankAsc !== null && rankAsc !== undefined) {
        const total = await redis.zCard(allTimeKey);
        rank = total - rankAsc; 
      }
    } catch (e) {}

    // FETCH THE WALLET COINS HERE:
    let wallet = 0;
    try {
      const walletStr = await redis.hGet('user_wallets', username);
      wallet = walletStr ? Number(walletStr) : 0;
    } catch (e) {
      console.warn("Fetch Wallet Error:", e);
    }

    return c.json({ 
      name: username,
      rank: rank,
      score: dailyBest,
      allTimeBest: allTimeBest,
      wallet: wallet 
    });
  } catch (error) {
    return c.json({ name: "Anonymous", rank: null, score: 0, allTimeBest: 0, wallet: 0 });
  }
});

// 5. POST: Custom Level Publish with VIRAL REDDIT POST
app.post('/api/custom-levels', async (c) => {
  try {
    const body = await c.req.json();
    const { name, elements } = body;
    const currentUser = await getUsername(c);
    
    const safeElements = elements || [];
    
    // 1. Save Level
    const levelId = `level:${Date.now()}:${Math.random().toString(36).substring(2, 7)}`;
    const levelData = {
      id: levelId,
      name: name || "Community Run",
      creator: `u/${currentUser}`,
      elements: safeElements
    };
    
    try {
      await redis.hSet('custom_levels', { [levelId]: JSON.stringify(levelData) });
    } catch (redisError) {}
    
    // 2. Create Viral Reddit Post
    try {
      if (context.subredditName) {
        await reddit.submitCustomPost({
          subredditName: context.subredditName,
          title: `☠️ u/${currentUser} forged "${levelData.name}"! Can you survive it?`,
          entry: 'default' 
        });
      }
    } catch (postError) {
      console.error("Failed to create Reddit post:", postError);
    }

    return c.json({ success: true, level: levelData });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 6. GET: Custom Levels
app.get('/api/custom-levels', async (c) => {
  try {
    let allLevelsRaw: any = {};
    try { allLevelsRaw = await redis.hGetAll('custom_levels') || {}; } catch (redisError) {}
    
    const levels = Object.values(allLevelsRaw).map(raw => {
      try { return JSON.parse(raw as string); } catch (parseError) { return null; }
    }).filter(lvl => lvl !== null);
    
    levels.reverse();
    return c.json(levels);
  } catch (error) {
    return c.json([]);
  }
});

const internal = new Hono();
internal.route('/menu', menu);
internal.route('/form', forms);
internal.route('/triggers', triggers);
app.route('/internal', internal);

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});

export default app;