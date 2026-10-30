// Export and import of the building as a JSON file. Without entities, a plan can be shared with others:
// areas, lights, sensors and every other link to this Home Assistant are removed.

import { normalizeBuilding, type Building } from "./model.ts";

export const EXPORT_FORMAT = "neonplan3d";

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: 1;
  exported_at: string;
  building: Building;
}

// Reference fields include nested modules (cars/pools/energy), not just the primary entity.
// Clear strings only: names such as grid, tilt, temperature and light also occur as numeric geometry/settings.
const SHARE_REFS = new Set(("area_id ha_floor entity entity_id device device_id contact contact2 cover tilt tilt2 position lock tilt_angle awning_position bin_source bin_out mailbox_door moisture remaining heat_sensor service service2 power door_left door_right soc charge export status room_sensor state_entity state_entity2 color_entity extra fan clients water_temp look_of type_entity window range charging plugged climate tracker temperature humidity co2 heater pump light ph chlorine salt grid solar battery battery_soc consumption tariff gas water weather_entity rain_entity notes camera person pipeline pipeline_id").split(" "));
const SHARE_ARRAYS = new Set(["placements", "presence", "panel", "hidden", "no_state", "detect_sensors", "favorites", "buttons", "media_presets", "pictures"]);
const SHARE_BLOCKS = new Set(["background", "mods", "director"]);
function shareCopy(value: unknown, key = ""): unknown {
  if (SHARE_ARRAYS.has(key)) return [];
  if (SHARE_BLOCKS.has(key)) return null;
  if (typeof value === "string" && (SHARE_REFS.has(key) || /_(entity|sensor|camera|pipeline)(2|_id)?$/.test(key) || key === "image")) return null;
  if (Array.isArray(value)) return value.map((item) => shareCopy(item));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, shareCopy(item, name)]));
  return value;
}

/** A geometry/design template without HA links, local actions, module data or personal images.
 * Full backups take a separate unfiltered copy. Template export never modifies the source building.
 */
export function withoutEntities(b: Building): Building {
  return shareCopy(b) as Building;
}

export function exportFile(b: Building, shareable: boolean): ExportFile {
  return { format: EXPORT_FORMAT, version: 1, exported_at: new Date().toISOString(), building: shareable ? withoutEntities(b) : structuredClone(b) };
}

/** Reads an export file; throws "not_json" or "not_plan" when it is none. */
export function parseExport(text: string): Building {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("not_json");
  }
  const file = data as Partial<ExportFile>;
  const b = (file?.format === EXPORT_FORMAT ? file.building : data) as Building | undefined;
  if (!b || b.version !== 1 || !Array.isArray(b.floors) || !b.settings) throw new Error("not_plan");
  // background images are not part of an export
  for (const f of b.floors) f.background = null;
  return normalizeBuilding(b);
}

/** Ids of the stored pictures a plan uses: floor backgrounds and screen pictures (not URLs or cameras). */
export function storedImageIds(b: Building): string[] {
  const ids = new Set<string>();
  for (const f of b.floors) {
    if (f.background?.image_id) ids.add(f.background.image_id);
    for (const m of f.furniture) for (const r of m.pictures ?? []) if (r.image && !/^https?:\/\//.test(r.image) && !r.image.startsWith("camera:")) ids.add(r.image);
  }
  return [...ids];
}

/** Starts a download of a text file in the browser. */
export function download(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
