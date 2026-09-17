// Local map editor server.
//   bun run map     ->  http://localhost:5173
// Serves the editor and reads/writes src/content/*.map.json in place, so a save
// in the browser lands in the same file the simulator (and Claude) reads.
import { readdir } from "node:fs/promises";
import { formatMapJson, type MapFile } from "../mapfile";
import { replay } from "../replay";

const ROOT = new URL("../..", import.meta.url).pathname;   // sim/
const CONTENT = `${ROOT}src/content`;
const PAGE = `${ROOT}src/tools/mapedit.html`;
const PORT = Number(process.env.PORT ?? 5173);

// Never let the browser cache the editor or the map: a stale copy looks exactly
// like "my edit didn't save".
const NOCACHE = { "cache-control": "no-store, must-revalidate", "pragma": "no-cache" };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...NOCACHE } });

const safe = (name: string) => /^[a-z0-9-]+$/i.test(name);

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",           // so the iPad on the same wifi can reach it
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;

    if (p === "/" || p === "/index.html")
      return new Response(Bun.file(PAGE), { headers: { "content-type": "text/html; charset=utf-8", ...NOCACHE } });

    if (p === "/api/maps") {
      const files = (await readdir(CONTENT)).filter(f => f.endsWith(".map.json"));
      return json(files.map(f => f.replace(".map.json", "")));
    }

    const m = p.match(/^\/api\/map\/([^/]+)$/);
    if (m) {
      const name = decodeURIComponent(m[1]);
      if (!safe(name)) return json({ error: "bad map name" }, 400);
      const file = `${CONTENT}/${name}.map.json`;

      if (req.method === "GET") {
        const f = Bun.file(file);
        if (!(await f.exists())) return json({ error: "no such map" }, 404);
        return new Response(f, { headers: { "content-type": "application/json", ...NOCACHE } });
      }
      if (req.method === "PUT") {
        let body: MapFile;
        try { body = await req.json() as MapFile; }
        catch { return json({ error: "invalid JSON" }, 400); }
        const b = body?.board;
        if (!b?.grid?.length || !b.w || !b.h) return json({ error: "map is missing board.grid/w/h" }, 400);
        if (b.grid.length !== b.h || b.grid.some((r: string) => r.length !== b.w))
          return json({ error: `board grid is not ${b.w}x${b.h}` }, 400);
        if (!body.floor) return json({ error: "map is missing a floor" }, 400);
        await Bun.write(file, formatMapJson(body));
        return json({ ok: true, saved: `src/content/${name}.map.json`, at: new Date().toISOString() });
      }
    }
    // One recorded game on the map the page sends (unsaved edits included), for the Sim view.
    if (p === "/api/sim" && req.method === "POST") {
      let body: { map: MapFile; seed?: number };
      try { body = await req.json() as typeof body; }
      catch { return json({ error: "invalid JSON" }, 400); }
      if (!body?.map?.board?.grid || !body.map.floor) return json({ error: "send { map, seed }" }, 400);
      const floor = body.map.floor.guide === "floor-2" ? 2 : 1;
      const seed = Number.isFinite(body.seed) ? Math.floor(body.seed!) : Math.floor(Math.random() * 1e6);
      try { return json(replay(body.map, floor, seed)); }
      catch (e) { return json({ error: `the sim could not run this map: ${(e as Error).message}` }, 400); }
    }
    // The floor guidebook: markdown kept next to the sim folder, rendered by the page's Guide view.
    const d = p.match(/^\/api\/doc\/([^/]+)$/);
    if (d) {
      const name = decodeURIComponent(d[1]);
      if (!safe(name)) return json({ error: "bad doc name" }, 400);
      const f = Bun.file(`${ROOT}../${name}.md`);
      if (!(await f.exists())) return new Response("not found", { status: 404, headers: NOCACHE });
      return new Response(f, { headers: { "content-type": "text/markdown; charset=utf-8", ...NOCACHE } });
    }
    return new Response("not found", { status: 404 });
  },
});

// Print a LAN address too, for the iPad.
const nets = Object.values(await import("node:os").then(os => os.networkInterfaces())).flat();
const lan = nets.find(n => n && n.family === "IPv4" && !n.internal)?.address;
console.log(`\n  map editor   http://localhost:${server.port}`);
if (lan) console.log(`  on the iPad  http://${lan}:${server.port}`);
console.log(`  editing      sim/src/content/*.map.json  (Save writes the file)`);
console.log(`  guide        ../<floor.guide>.md, served live to the Guide view\n`);
