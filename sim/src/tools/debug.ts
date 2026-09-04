import { Game } from "../engine";
const g: any = new Game({ seed: Number(process.argv[2] ?? 1003), optionalRooms: [4, 8], maxRounds: 30 });
const origHeroTurn = g.heroTurn.bind(g);
g.heroTurn = (h: any) => {
  const before = { ...h.pos };
  origHeroTurn(h);
  if (g.round > 12 && g.round < 18)
    console.log(`  r${g.round} ${h.name.padEnd(6)} ${JSON.stringify(before)}->${JSON.stringify(h.pos)}` +
      ` hp${h.hp} room=${g.board.roomIdAt(h.pos)} target=${g.currentRoom()} urgent=${g.urgent}`);
};
const r = g.run();
console.log(JSON.stringify({ outcome: r.outcome, rounds: r.rounds, kills: r.monstersKilled }, null, 1));
console.log("alive monsters:", g.monsters.filter((m: any) => m.alive).map((m: any) => `${m.def.id}@r${m.room}(${m.pos.x},${m.pos.y})act=${m.active}`).join(" "));
console.log("heroes:", g.heroes.map((h: any) => `${h.name}(${h.pos.x},${h.pos.y})hp${h.hp}`).join(" "));
console.log("route:", g.route, "currentRoom:", g.currentRoom(), "usedInteract:", [...g.usedInteract]);
