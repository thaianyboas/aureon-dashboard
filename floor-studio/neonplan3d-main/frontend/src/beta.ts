/**
 * Supporter beta: a new Pro add-on is first handed to Supporter-Pass holders only, who test it and give
 * feedback on Discord; once it is stable it is sold to everyone. Everybody sees the add-on, marked as
 * "beta, first for supporters". The list changes with the release that ends the beta.
 */
import type { Feature } from "./features.ts";

export const BETA_FEATURES: readonly Feature[] = ["pool"];

export function isBeta(feature: Feature): boolean {
  return BETA_FEATURES.includes(feature);
}

/** The Discord server; supporters see the channel #beta-feedback there. */
export const DISCORD_URL = "https://discord.gg/SSdVVFsev7";
