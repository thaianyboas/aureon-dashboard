// Websocket calls to the backend (custom_components/neonplan3d/websocket.py).

import type { Building } from "./model.ts";
import type { FurniturePack } from "./packs.ts";
import type { HomeAssistant } from "./types.ts";

export async function fetchBuilding(hass: HomeAssistant): Promise<{ building: Building; revision: number; version?: string }> {
  return hass.callWS({ type: "neonplan3d/building/get" });
}

export async function saveBuilding(hass: HomeAssistant, building: Building): Promise<number> {
  const res = await hass.callWS<{ revision: number }>({ type: "neonplan3d/building/save", building });
  return res.revision;
}

export function subscribeBuilding(hass: HomeAssistant, callback: (revision: number) => void): Promise<() => Promise<void>> {
  return hass.connection.subscribeMessage<{ revision: number }>((msg) => callback(msg.revision), {
    type: "neonplan3d/building/subscribe",
  });
}

/** A sentence Assist or the service `neonplan3d.ask` hands to the open views. */
export interface Ask {
  ask_id: string;
  text: string;
  /** Only the view with this screen name reacts (null: every open view). */
  screen: string | null;
  /** The view speaks its answer (a satellite that asked speaks itself). */
  speak: boolean;
  /** Plan rooms to fly into instead of a sentence ("Where is Torsten?": his room; "Who is home?": a tour). */
  show_rooms?: string[];
  /** The rooms are people's while people are shown to admins only: only an admin's view flies there. */
  admins_only?: boolean;
}

export function subscribeAsk(hass: HomeAssistant, callback: (ask: Ask) => void): Promise<() => Promise<void>> {
  return hass.connection.subscribeMessage<Ask>(callback, { type: "neonplan3d/voice/subscribe" });
}

/** The view's answer; `taken` is false when another view was first. */
export async function answerAsk(hass: HomeAssistant, askId: string, text: string, answered: boolean): Promise<boolean> {
  const res = await hass.callWS<{ taken: boolean }>({ type: "neonplan3d/voice/answer", ask_id: askId, text, answered });
  return res.taken;
}

export async function fetchImage(hass: HomeAssistant, imageId: string): Promise<string> {
  const res = await hass.callWS<{ data: string }>({ type: "neonplan3d/image/get", image_id: imageId });
  return res.data;
}

export async function storeImage(hass: HomeAssistant, imageId: string, data: string): Promise<void> {
  await hass.callWS({ type: "neonplan3d/image/set", image_id: imageId, data });
}

export interface Snapshot {
  id: string;
  revision: number;
  /** Unix time in seconds. */
  saved_at: number;
  floors: number;
  rooms: number;
  furniture: number;
}

export async function listHistory(hass: HomeAssistant): Promise<Snapshot[]> {
  const res = await hass.callWS<{ snapshots: Snapshot[] }>({ type: "neonplan3d/history/list" });
  return res.snapshots;
}

export async function takeSnapshot(hass: HomeAssistant): Promise<void> {
  await hass.callWS({ type: "neonplan3d/history/snapshot" });
}

export async function restoreSnapshot(hass: HomeAssistant, snapshotId: string): Promise<number> {
  const res = await hass.callWS<{ revision: number }>({ type: "neonplan3d/history/restore", snapshot_id: snapshotId });
  return res.revision;
}

export async function listPacks(hass: HomeAssistant): Promise<FurniturePack[]> {
  const res = await hass.callWS<{ packs: FurniturePack[] }>({ type: "neonplan3d/packs/list" });
  return res.packs;
}

export interface ImportedPack {
  id: string;
  name: string;
  publisher: string;
  licensee: string | null;
  items: number;
  /** Module code that waits for an admin's approval on the extensions page before it runs. */
  approval?: boolean;
}

/** A module's code for an admin to read before approving it (the installed code or the waiting update). */
export interface ModuleReview {
  id: string;
  name: string;
  publisher: string;
  licensee: string | null;
  release: number;
  api: number;
  kind: string;
  sha: string;
  code: string;
}

export function reviewModule(hass: HomeAssistant, packId: string, pending: boolean): Promise<ModuleReview> {
  return hass.callWS<ModuleReview>({ type: "neonplan3d/modules/review", pack_id: packId, pending });
}

/** Approves exactly the reviewed code (by its fingerprint); from then on it runs. */
export async function approveModule(hass: HomeAssistant, packId: string, sha: string): Promise<void> {
  await hass.callWS({ type: "neonplan3d/modules/approve", pack_id: packId, sha });
}

/** Import a pack file; the backend checks its signature (errors carry a code, e.g. "bad_signature"). */
export async function importPack(hass: HomeAssistant, text: string): Promise<ImportedPack> {
  return hass.callWS<ImportedPack>({ type: "neonplan3d/packs/import", pack: text });
}

export async function removePack(hass: HomeAssistant, packId: string): Promise<void> {
  await hass.callWS({ type: "neonplan3d/packs/remove", pack_id: packId });
}

/** A full backup file: the plan, the packs with their signatures and every stored picture. */
export interface BackupFile {
  format: "neonplan3d-backup";
  version: 1;
  exported_at?: string;
  building: Building;
  packs?: FurniturePack[];
  images?: Record<string, string>;
}

export function fetchBackup(hass: HomeAssistant): Promise<Pick<BackupFile, "format" | "version" | "building" | "packs">> {
  return hass.callWS({ type: "neonplan3d/backup/export" });
}

/** Replace plan and packs from a backup (pictures follow one by one); packs that fail their check are skipped. */
export function restoreBackup(
  hass: HomeAssistant,
  building: Building,
  packs: FurniturePack[],
): Promise<{ revision: number; building: Building; packs: number; skipped: { id: string; reason: string }[] }> {
  return hass.callWS({ type: "neonplan3d/backup/import", building, packs });
}



/** The opt-in reports ("help improve NeonPlan"): the setting and the exact next daily report. */
export interface DiagnosticsStatus {
  enabled: boolean;
  /** Unix time in seconds of the last daily report (or of switching on). */
  last_daily: number | null;
  /** Reports went out under this or an earlier id and can be deleted on the server. */
  can_delete: boolean;
  preview: Record<string, unknown>;
  endpoint: string;
}

export async function getDiagnostics(hass: HomeAssistant): Promise<DiagnosticsStatus> {
  return hass.callWS<DiagnosticsStatus>({ type: "neonplan3d/diagnostics/get" });
}

export async function setDiagnostics(hass: HomeAssistant, enabled: boolean): Promise<DiagnosticsStatus> {
  return hass.callWS<DiagnosticsStatus>({ type: "neonplan3d/diagnostics/set", enabled });
}

/** Ask the server to delete what was sent, forget the id and switch off (fails when the server is unreachable). */
export async function deleteDiagnostics(hass: HomeAssistant): Promise<DiagnosticsStatus> {
  return hass.callWS<DiagnosticsStatus>({ type: "neonplan3d/diagnostics/delete" });
}

export type SentenceMode = "distinct" | "all" | "off";

/** Which sentences Assist hands to NeonPlan (the sentence files Home Assistant reads). */
export async function getVoiceSettings(hass: HomeAssistant): Promise<{ sentences: SentenceMode }> {
  return hass.callWS({ type: "neonplan3d/voice/settings" });
}

export async function setVoiceSentences(hass: HomeAssistant, sentences: SentenceMode): Promise<{ sentences: SentenceMode; kept?: string[] }> {
  return hass.callWS({ type: "neonplan3d/voice/settings/set", sentences });
}
