/** AUREON local source adapter. Never auto-enable code with Home Assistant access. */
import { approveAureonModule, type NeonModule } from "../modules";
// Local files only. These are original AUREON sources, not Mastershort paid extensions.
// @ts-ignore: Local JS source modules are bundled by esbuild.
import modules from "./module-settings.mjs";

/** Call from an explicit admin approval UI action, not during startup. */
export function setAureonApproval(approved: boolean): void {
  for (const mod of modules as NeonModule[]) approveAureonModule(mod, approved);
}
export function bundledAureonModuleIds(): string[] {
  return (modules as NeonModule[]).map(m => m.id);
}

/** Enable or revoke one specific bundled module; never approve all by accident. */
export function setAureonModuleApproval(id: string, approved: boolean): void {
  const mod = (modules as NeonModule[]).find(m => m.id === id);
  if (!mod) throw new Error(`Unknown bundled AUREON module: ${id}`);
  approveAureonModule(mod, approved);
}
