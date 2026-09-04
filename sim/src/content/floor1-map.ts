// The simulator reads the map from JSON so the browser editor and the sim
// share one source of truth. Edit src/content/floor1.map.json -- by hand, or
// with `bun run map` (the editor at http://localhost:5173).
import raw from "./floor1.map.json";
import { toFloorDef, type MapFile } from "../mapfile";

export const FLOOR1_MAP = raw as unknown as MapFile;
export const FLOOR1 = toFloorDef(FLOOR1_MAP);
