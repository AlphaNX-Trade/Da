/**
 * Dasara Zone - Cloudflare Pages Functions API Handler
 * Handles all /api/* requests using Cloudflare D1
 * Developed by Alpha
 */

interface D1Database {
  prepare(query: string): {
    bind(...values: any[]): any;
    first<T = any>(colName?: string): Promise<T | null>;
    all<T = any>(): Promise<{ results?: T[]; success: boolean }>;
    run(): Promise<{ success: boolean; meta?: any }>;
  };
  batch(statements: any[]): Promise<any[]>;
}

interface Env {
  DB: D1Database;
}

type PagesFunction<T = any> = (context: {
  request: Request;
  env: T;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
  data: Record<string, any>;
}) => Promise<Response>;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (!env.DB) {
    return new Response(JSON.stringify({ 
      error: 'Cloudflare D1 database is not configured. Please bind DB in wrangler.toml or Cloudflare Pages dashboard.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Health Check
    if (path === '/api/health' && method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        database: 'cloudflare-d1',
        timestamp: new Date().toISOString(),
        name: 'Dasara Zone',
        developer: 'Alpha'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Stats
    if (path === '/api/stats' && method === 'GET') {
      const g = await env.DB.prepare('SELECT COUNT(*) as count FROM games').first<{ count: number }>();
      const p = await env.DB.prepare('SELECT COUNT(*) as count FROM participants').first<{ count: number }>();
      const s = await env.DB.prepare('SELECT COUNT(*) as count FROM participation').first<{ count: number }>();

      return new Response(JSON.stringify({
        gamesCount: g?.count || 0,
        participantsCount: p?.count || 0,
        selectionsCount: s?.count || 0
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Games: GET /api/games
    if (path === '/api/games' && method === 'GET') {
      const { results } = await env.DB.prepare(`
        SELECT 
          g.id, 
          g.name, 
          g.created_at,
          COUNT(p.id) as participant_count
        FROM games g
        LEFT JOIN participation p ON g.id = p.game_id
        GROUP BY g.id
        ORDER BY g.created_at ASC
      `).all();

      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Games: POST /api/games
    if (path === '/api/games' && method === 'POST') {
      const body = await request.json() as any;
      const name = body?.name?.trim();
      if (!name) {
        return new Response(JSON.stringify({ error: 'Game name is required' }), { status: 400 });
      }

      const existing = await env.DB.prepare('SELECT id FROM games WHERE LOWER(name) = LOWER(?)').bind(name).first();
      if (existing) {
        return new Response(JSON.stringify({ error: `Game "${name}" already exists` }), { status: 409 });
      }

      const id = 'game_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const createdAt = new Date().toISOString();

      await env.DB.prepare('INSERT INTO games (id, name, created_at) VALUES (?, ?, ?)').bind(id, name, createdAt).run();

      return new Response(JSON.stringify({ id, name, created_at: createdAt, participant_count: 0 }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Games: PUT /api/games/:id
    const gameMatch = path.match(/^\/api\/games\/([a-zA-Z0-9_-]+)$/);
    if (gameMatch && method === 'PUT') {
      const gameId = gameMatch[1];
      const body = await request.json() as any;
      const name = body?.name?.trim();
      if (!name) {
        return new Response(JSON.stringify({ error: 'Game name is required' }), { status: 400 });
      }

      const existing = await env.DB.prepare('SELECT id FROM games WHERE LOWER(name) = LOWER(?) AND id != ?').bind(name, gameId).first();
      if (existing) {
        return new Response(JSON.stringify({ error: `Another game named "${name}" already exists` }), { status: 409 });
      }

      const res = await env.DB.prepare('UPDATE games SET name = ? WHERE id = ?').bind(name, gameId).run();
      if (!res.success) {
        return new Response(JSON.stringify({ error: 'Game not found' }), { status: 404 });
      }

      return new Response(JSON.stringify({ id: gameId, name }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Games: DELETE /api/games/:id
    if (gameMatch && method === 'DELETE') {
      const gameId = gameMatch[1];
      await env.DB.batch([
        env.DB.prepare('DELETE FROM participation WHERE game_id = ?').bind(gameId),
        env.DB.prepare('DELETE FROM games WHERE id = ?').bind(gameId)
      ]);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Participants: GET /api/participants
    if (path === '/api/participants' && method === 'GET') {
      const { results } = await env.DB.prepare(`
        SELECT 
          p.id, 
          p.name, 
          p.age,
          p.class,
          p.section,
          p.created_at,
          COUNT(pt.id) as games_count
        FROM participants p
        LEFT JOIN participation pt ON p.id = pt.participant_id
        GROUP BY p.id
        ORDER BY p.created_at ASC
      `).all();

      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Participants: POST /api/participants
    if (path === '/api/participants' && method === 'POST') {
      const body = await request.json() as any;
      const name = body?.name?.trim();
      const age = parseInt(body?.age, 10);
      const className = body?.class?.trim();
      const section = body?.section ? body.section.trim() : null;

      if (!name) return new Response(JSON.stringify({ error: 'Participant name is required' }), { status: 400 });
      if (isNaN(age) || age <= 0 || age > 120) return new Response(JSON.stringify({ error: 'Age must be a positive whole number' }), { status: 400 });
      if (!className) return new Response(JSON.stringify({ error: 'Class is required' }), { status: 400 });

      const id = 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const createdAt = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO participants (id, name, age, class, section, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, name, age, className, section, createdAt).run();

      return new Response(JSON.stringify({
        id, name, age, class: className, section, created_at: createdAt, games_count: 0
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // Participants: PUT /api/participants/:id
    const partMatch = path.match(/^\/api\/participants\/([a-zA-Z0-9_-]+)$/);
    if (partMatch && method === 'PUT') {
      const partId = partMatch[1];
      const body = await request.json() as any;
      const name = body?.name?.trim();
      const age = parseInt(body?.age, 10);
      const className = body?.class?.trim();
      const section = body?.section ? body.section.trim() : null;

      if (!name) return new Response(JSON.stringify({ error: 'Participant name is required' }), { status: 400 });
      if (isNaN(age) || age <= 0 || age > 120) return new Response(JSON.stringify({ error: 'Age must be a positive whole number' }), { status: 400 });
      if (!className) return new Response(JSON.stringify({ error: 'Class is required' }), { status: 400 });

      await env.DB.prepare(`
        UPDATE participants 
        SET name = ?, age = ?, class = ?, section = ?
        WHERE id = ?
      `).bind(name, age, className, section, partId).run();

      return new Response(JSON.stringify({
        id: partId, name, age, class: className, section
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Participants: DELETE /api/participants/:id
    if (partMatch && method === 'DELETE') {
      const partId = partMatch[1];
      await env.DB.batch([
        env.DB.prepare('DELETE FROM participation WHERE participant_id = ?').bind(partId),
        env.DB.prepare('DELETE FROM participants WHERE id = ?').bind(partId)
      ]);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Participation: GET /api/participation
    if (path === '/api/participation' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT id, participant_id, game_id, created_at FROM participation').all();
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Participation: POST /api/participation/toggle
    if (path === '/api/participation/toggle' && method === 'POST') {
      const { participant_id, game_id, selected } = await request.json() as any;
      if (!participant_id || !game_id) {
        return new Response(JSON.stringify({ error: 'Missing participant_id or game_id' }), { status: 400 });
      }

      if (selected) {
        const existing = await env.DB.prepare('SELECT id FROM participation WHERE participant_id = ? AND game_id = ?').bind(participant_id, game_id).first();
        if (!existing) {
          const id = 'pt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          const createdAt = new Date().toISOString();
          await env.DB.prepare('INSERT INTO participation (id, participant_id, game_id, created_at) VALUES (?, ?, ?, ?)').bind(id, participant_id, game_id, createdAt).run();
          return new Response(JSON.stringify({ selected: true, record: { id, participant_id, game_id, created_at: createdAt } }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ selected: true, record: existing }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        await env.DB.prepare('DELETE FROM participation WHERE participant_id = ? AND game_id = ?').bind(participant_id, game_id).run();
        return new Response(JSON.stringify({ selected: false, participant_id, game_id }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Export: GET /api/export/participants
    if (path === '/api/export/participants' && method === 'GET') {
      const { results } = await env.DB.prepare(`
        SELECT name, age, class, COALESCE(section, '') as section
        FROM participants
        ORDER BY name ASC
      `).all() as any;

      let csv = '\uFEFFName,Age,Class,Section\r\n';
      for (const r of results) {
        const cleanName = `"${String(r.name).replace(/"/g, '""')}"`;
        const cleanClass = `"${String(r.class).replace(/"/g, '""')}"`;
        const cleanSection = `"${String(r.section).replace(/"/g, '""')}"`;
        csv += `${cleanName},${r.age},${cleanClass},${cleanSection}\r\n`;
      }

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="dasara_zone_participants.csv"'
        }
      });
    }

    // Export: GET /api/export/participation
    if (path === '/api/export/participation' && method === 'GET') {
      const { results: games } = await env.DB.prepare('SELECT id, name FROM games ORDER BY created_at ASC').all() as any;
      const { results: participants } = await env.DB.prepare("SELECT id, name, age, class, COALESCE(section, '') as section FROM participants ORDER BY name ASC").all() as any;
      const { results: selections } = await env.DB.prepare('SELECT participant_id, game_id FROM participation').all() as any;

      const selectionSet = new Set<string>();
      for (const s of selections) {
        selectionSet.add(`${s.participant_id}_${s.game_id}`);
      }

      const gameHeaders = games.map((g: any) => `"${String(g.name).replace(/"/g, '""')}"`).join(',');
      let csv = `\uFEFFName,Age,Class,Section${gameHeaders ? ',' + gameHeaders : ''},Total Games\r\n`;

      for (const p of participants) {
        const cleanName = `"${String(p.name).replace(/"/g, '""')}"`;
        const cleanClass = `"${String(p.class).replace(/"/g, '""')}"`;
        const cleanSection = `"${String(p.section).replace(/"/g, '""')}"`;

        let gameCount = 0;
        const gameColumns = games.map((g: any) => {
          const isSelected = selectionSet.has(`${p.id}_${g.id}`);
          if (isSelected) gameCount++;
          return isSelected ? 'Yes' : 'No';
        }).join(',');

        csv += `${cleanName},${p.age},${cleanClass},${cleanSection}${gameColumns ? ',' + gameColumns : ''},${gameCount}\r\n`;
      }

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="dasara_zone_participation.csv"'
        }
      });
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
