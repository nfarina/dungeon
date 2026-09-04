// Local map editor server.
//   bun run map     ->  http://localhost:5173
// Serves the editor and reads/writes src/content/*.map.json in place, so a save
// in the browser lands in the same file the simulator (and Claude) reads.
import { readdir } from "node:fs/promises";
import { formatMapJson, type MapFile } from "../mapfile";

const ROOT = new URL("../..", import.meta.url).pathname;   // sim/
const CONTENT = `${ROOT}src/content`;
const PAGE = `${ROOT}src/tools/mapedit.html`;
const PORT = Number(process.env.PORT ?? 5173);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

const safe = (name: string) => /^[a-z0-9-]+$/i.test(name);

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",           // so the iPad on the same wifi can reach it
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;

    if (p === "/" || p === "/index.html") return new Response(Bun.file(PAGE));

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
        return new Response(f, { headers: { "content-type": "application/json" } });
      }
      if (req.method === "PUT") {
        let body: MapFile;
        try { body = await req.json() as MapFile; }
        catch { return json({ error: "invalid JSON" }, 400); }
        if (!body?.grid?.length || !body.w || !body.h) return json({ error: "map is missing grid/w/h" }, 400);
        if (body.grid.length !== body.h || body.grid.some(r => r.length !== body.w))
          return json({ error: `grid is not ${body.w}x${body.h}` }, 400);
        await Bun.write(file, formatMapJson(body));
        return json({ ok: true, saved: `src/content/${name}.map.json`, at: new Date().toISOString() });
      }
    }
    return new Response("not found", { status: 404 });
  },
});

// Print a LAN address too, for the iPad.
const nets = Object.values(await import("node:os").then(os => os.networkInterfaces())).flat();
const lan = nets.find(n => n && n.family === "IPv4" && !n.internal)?.address;
console.log(`\n  map editor   http://localhost:${server.port}`);
if (lan) console.log(`  on the iPad  http://${lan}:${server.port}`);
console.log(`  editing      sim/src/content/*.map.json  (Save writes the file)\n`);
