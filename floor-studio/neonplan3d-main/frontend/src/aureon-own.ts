// AUREON: the owner's own furniture models in <config>/aureon_models – listing and importing them (a .zip with
// models and catalog.json, or single .glb files). Used by the editor's "Meus móveis" and the Floor Studio "Ajustes".
import type { HomeAssistant } from "./types.ts";

export interface AureonOwnModel {
  file: string;
  url: string;
  size: [number, number, number];
  name?: string;
  type?: string;
  mount_y?: number;
  mirror?: boolean;
}

export async function listOwnFurniture(hass: HomeAssistant): Promise<AureonOwnModel[]> {
  const r = await hass.callWS<{ models: AureonOwnModel[] }>({ type: "aureon_floor/aureon_models/list" });
  return Array.isArray(r?.models) ? r.models : [];
}

export interface ImportResult {
  added: number;
  replaced: number;
  names: number;
  failed: string[];
}

/** Uploads the files one by one (administrators only; the backend checks every model and deletes nothing). */
export async function importOwnFurniture(hass: HomeAssistant, files: Iterable<File>): Promise<ImportResult> {
  const fetchWithAuth = (hass as unknown as { fetchWithAuth?: (url: string, init?: RequestInit) => Promise<Response> }).fetchWithAuth;
  const out: ImportResult = { added: 0, replaced: 0, names: 0, failed: [] };
  for (const file of files) {
    try {
      if (!fetchWithAuth) throw new Error("no fetchWithAuth");
      const res = await fetchWithAuth(`/api/aureon_floor/aureon_models_upload?name=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      });
      const r = (await res.json().catch(() => ({}))) as { added?: string[]; replaced?: string[]; names?: number; error?: string };
      if (!res.ok) throw new Error(r.error ?? String(res.status));
      out.added += r.added?.length ?? 0;
      out.replaced += r.replaced?.length ?? 0;
      out.names += r.names ?? 0;
    } catch {
      out.failed.push(file.name);
    }
  }
  return out;
}
