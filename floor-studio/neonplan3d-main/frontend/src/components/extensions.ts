// Installed local resources and user imports.
// It lives in the editor bundle (loaded with it) and is shown to admins only.

import { css, html, LitElement, nothing } from "lit";
import { approveModule, importPack, removePack, reviewModule, type ModuleReview } from "../api.ts";
import { FUN, knownFeature, unlockedFeatures } from "../features.ts";
import { DOG_BREEDS, PET_FURS_OF, type Building, type Pet } from "../model.ts";
import { translate, type I18nKey } from "../i18n.ts";
import { packName, type FurniturePack } from "../packs.ts";
import { moduleWaits } from "../modules.ts";
import { controls, tokens } from "../styles.ts";
import type { HomeAssistant } from "../types.ts";

export class Extensions extends LitElement {
  static properties = {
    hass: { attribute: false },
    packs: { attribute: false },
    building: { attribute: false },
    _packMsg: { state: true },
    _moduleMsg: { state: true },
    _review: { state: true },
    _open: { state: true },
  };

  declare hass: HomeAssistant | undefined;
  declare packs: FurniturePack[] | undefined;
  /** The plan (the fun packs keep their settings in it, e.g. the pets). */
  declare building: Building | null | undefined;
  private declare _packMsg: { ok: boolean; text: string } | null;
  private declare _moduleMsg: { ok: boolean; text: string } | null;
  /** The module code an admin is reading before approving it. */
  private declare _review: { pack: FurniturePack; data: ModuleReview | null; error: string | null; busy: boolean } | null;

  private declare _open: Set<string>;

  constructor() {
    super();
    this._packMsg = null;
    this._moduleMsg = null;
    this._review = null;
    let open: string[] = [];
    try {
      open = JSON.parse(localStorage.getItem("neonplan3d.ext.open") ?? "[]") as string[];
    } catch {
      // nothing remembered
    }
    this._open = new Set(open);

  }

  private toggleOpen(key: string): void {
    const next = new Set(this._open);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this._open = next;
    try {
      localStorage.setItem("neonplan3d.ext.open", JSON.stringify([...next]));
    } catch {
      // a private window: it stays open for this visit only
    }
  }

  /**
   * A list summed up in one bar: how many are there (installed), have an update, are still to get – the parts of the
   * bar in their colours, the numbers beside it, a tap opens the list.
   */
  private summaryBar(key: string, parts: { n: number; label: string; tone: "ok" | "update" | "missing" }[]) {
    const total = parts.reduce((s, p) => s + p.n, 0);
    const open = this._open.has(key);
    return html`<button class="fp3d-sum" aria-expanded=${open} @click=${() => this.toggleOpen(key)}>
      <span class="fp3d-sum-bar">
        ${parts.filter((p) => p.n > 0).map((p) => html`<i class="fp3d-sum-${p.tone}" style="flex:${p.n}"></i>`)}
      </span>
      <span class="fp3d-sum-text">
        ${parts.filter((p) => p.n > 0 || p.tone === "ok").map((p) => html`<b class="fp3d-sum-${p.tone}-text">${p.n}</b> ${p.label}`)}
        ${total ? nothing : html`<span class="fp3d-sub">–</span>`}
      </span>
      <span class="fp3d-sum-caret">${open ? "▾" : "▸"} ${this.t(open ? "ext_hide_list" : "ext_show_list")}</span>
    </button>`;
  }

  private get isAdmin(): boolean {
    return this.hass?.user?.is_admin ?? false;
  }

  private t(key: I18nKey, vars?: Record<string, string | number>): string {
    return translate(this.hass, key, vars);
  }

  protected render() {
    // AUREON public distribution: no storefront, purchase links, offers or
    // license-key prompts. Existing locally imported packs remain available.
    // Private licensed assets are never bundled with the public frontend.
    return html`<div class="fp3d-ext">
      <header class="fp3d-ext-head">
        <h2>${this.t("packs")}</h2>
        <p class="fp3d-sub">${this.t("ext_intro")}</p>
      </header>
      ${this.renderFun(unlockedFeatures(this.packs ?? []))} ${this.renderPacks()}
      ${this.renderModules()}
    </div>`;
  }

  /** A changed plan goes to the panel, which saves it. */
  private editBuilding(fn: (b: Building) => void): void {
    if (!this.building) return;
    const next = structuredClone(this.building);
    fn(next);
    this.dispatchEvent(new CustomEvent("building-edit", { detail: next, bubbles: true, composed: true }));
  }

  private renderFun(unlocked: Set<string>) {
    // unlocked by an installed pack (this page's own list), or shown to test with the lab switch
    const shown = FUN.filter((f) => unlocked.has(f));
    if (!shown.length) return nothing;
    const pets = this.building?.settings.pets ?? null;
    const list = pets?.list ?? [];
    const on = pets?.on !== false;
    // the floors to live on, lowest first (a pet without a floor lives on the lowest)
    const floors = (this.building?.floors ?? []).filter((f) => f.rooms.length).sort((a, b) => a.elevation - b.elevation);
    const set = (fn: (p: { on: boolean; list: Pet[] }) => void) =>
      this.editBuilding((b) => {
        const p = { on: b.settings.pets?.on !== false, list: [...(b.settings.pets?.list ?? [])] };
        fn(p);
        b.settings.pets = p;
      });
    const change = (id: string, patch: Partial<Pet>) => set((p) => (p.list = p.list.map((x) => (x.id === id ? { ...x, ...patch } : x))));
    return html`<section class="fp3d-ext-card">
      <h3>🎈 ${this.t("fun_title")}</h3>
      <p class="fp3d-sub">${this.t("fun_intro")}</p>
      ${shown.map((f) =>
        f === "fun_halloween"
          ? this.renderHalloween(unlocked.has(f))
          : unlocked.has(f)
          ? html`<div class="fp3d-ext-feature fp3d-ext-on">
              <b>✓ ${this.t("fun_name_pets")}</b>
              <span class="fp3d-sub">${this.t("fun_feature_pets")}</span>
              ${this.isAdmin && this.building
                ? html`<label class="fp3d-check"><input type="checkbox" .checked=${on} @change=${(e: Event) => set((p) => (p.on = (e.target as HTMLInputElement).checked))} /> ${this.t("pets_show")}</label>
                    ${list.map(
                      (pet) => html`<div class="fp3d-pet-row">
                        <select
                          aria-label=${this.t("pet_kind")}
                          @change=${(e: Event) => {
                            // another kind: a fur it comes in, a dog a breed
                            const kind = (e.target as HTMLSelectElement).value as Pet["kind"];
                            const furs = PET_FURS_OF[kind];
                            change(pet.id, { kind, fur: furs.includes(pet.fur) ? pet.fur : furs[0], breed: kind === "dog" ? (pet.breed ?? "labrador") : null });
                          }}
                        >
                          ${(["cat", "dog", "rabbit"] as const).map((k) => html`<option value=${k} ?selected=${pet.kind === k}>${this.t(`pet_kind_${k}`)}</option>`)}
                        </select>
                        ${pet.kind === "dog"
                          ? html`<select aria-label=${this.t("pet_breed")} @change=${(e: Event) => change(pet.id, { breed: (e.target as HTMLSelectElement).value })}>
                              ${DOG_BREEDS.map((r) => html`<option value=${r} ?selected=${(pet.breed ?? "labrador") === r}>${this.t(`pet_breed_${r}`)}</option>`)}
                            </select>`
                          : nothing}
                        <input type="text" maxlength="30" .value=${pet.name} placeholder=${this.t("pet_name")} aria-label=${this.t("pet_name")} @change=${(e: Event) => change(pet.id, { name: (e.target as HTMLInputElement).value.trim() })} />
                        <select aria-label=${this.t("pet_fur")} @change=${(e: Event) => change(pet.id, { fur: (e.target as HTMLSelectElement).value })}>
                          ${PET_FURS_OF[pet.kind].map((c) => html`<option value=${c} ?selected=${pet.fur === c}>${this.t(`pet_fur_${c}` as I18nKey)}</option>`)}
                        </select>
                        ${floors.length > 1
                          ? html`<select title=${this.t("pet_floor")} aria-label=${this.t("pet_floor")} @change=${(e: Event) => change(pet.id, { floor_id: (e.target as HTMLSelectElement).value || null })}>
                              ${floors.map((fl, i) => html`<option value=${i === 0 ? "" : fl.id} ?selected=${(pet.floor_id ?? floors[0].id) === fl.id}>🏠 ${fl.name}</option>`)}
                            </select>`
                          : nothing}
                        <button class="fp3d-btn" title=${this.t("delete")} @click=${() => set((p) => (p.list = p.list.filter((x) => x.id !== pet.id)))}>✕</button>
                      </div>`,
                    )}
                    ${list.length < 8
                      ? html`<button class="fp3d-btn" @click=${() =>
                          set((p) => p.list.push({ id: `pet_${Date.now().toString(36)}`, kind: "cat", name: "", fur: PET_FURS_OF.cat[p.list.length % PET_FURS_OF.cat.length] }))}>+ ${this.t("pet_add")}</button>`
                      : nothing}`
                : nothing}
            </div>`
          : nothing,
      )}
    </section>`;
  }

  /** Fun pack "Halloween": decorations in the furniture library, and the ghost to switch on and off. */
  private renderHalloween(unlocked: boolean) {
    const ghost = this.building?.settings.halloween?.ghost !== false;
    if (!unlocked) return nothing;
    return html`<div class="fp3d-ext-feature fp3d-ext-on">
      <b>✓ 🎃 ${this.t("fun_name_halloween")}</b>
      <span class="fp3d-sub">${this.t("fun_feature_halloween")}</span>
      ${this.isAdmin && this.building
        ? html`<label class="fp3d-check"
            ><input
              type="checkbox"
              .checked=${ghost}
              @change=${(e: Event) => this.editBuilding((b) => (b.settings.halloween = { ...(b.settings.halloween ?? {}), ghost: (e.target as HTMLInputElement).checked }))}
            />
            ${this.t("halloween_ghost")}</label
          >`
        : nothing}
      <span class="fp3d-sub">${this.t("halloween_deco_hint")}</span>
    </div>`;
  }

  /** Packs that were updated since the last visit: what they brought (shown until the page is left). */

  private renderPacks() {
    // modules and Pro add-ons (modules soon) have their own section below: here only packs with furniture
    const packs = (this.packs ?? []).filter((p) => !p.module && !p.features?.length);
    const items = packs.reduce((s, p) => s + p.items.length, 0);
    return html`<section class="fp3d-ext-card">
      <h3>${this.t("packs")}</h3>
      ${this.summaryBar("packs", [{ n: packs.length, label: this.t("ext_sum_packs", { items }), tone: "ok" }])}
      ${(this._open.has("packs") ? packs : []).map(
        (p) => html`<div class="fp3d-pack">
          <div>
            <b>${packName(p, this.hass?.language ?? "de")}</b>
            <span class="fp3d-sub">${p.module ? this.t("pack_module", { publisher: p.publisher }) : p.features?.length ? this.t("pack_features", { publisher: p.publisher, n: p.features.length }) : this.t("pack_by", { publisher: p.publisher, n: p.items.length })}</span>
            ${(p.features ?? []).some((f) => !knownFeature(f)) ? html`<span class="fp3d-sub fp3d-pack-error">${this.t("pack_needs_update")}</span>` : nothing}
          </div>
          <button class="fp3d-btn fp3d-danger" @click=${() => this.deletePack(p)}>${this.t("pack_remove")}</button>
        </div>`,
      )}

      <label class="fp3d-btn fp3d-primary fp3d-pack-import">
        ${this.t("pack_import")}
        <input type="file" accept=".fp3dpack,.json,application/json" multiple hidden @change=${(e: Event) => this.importPackFile(e)} />
      </label>
      ${this._packMsg ? html`<p class="fp3d-sub ${this._packMsg.ok ? "fp3d-notice" : "fp3d-pack-error"}">${this._packMsg.text}</p>` : nothing}
      <p class="fp3d-sub">${this.t("packs_hint")}</p>
    </section>`;
  }

  /** Modules: signed packs that carry code – and the Pro add-ons, which become modules (the editor's ⚙ Module dialog shows the same list). */
  private renderModules() {
    const modules = (this.packs ?? []).filter((p) => p.module || p.features?.length);
    const pro = modules.filter((p) => !p.module).length;
    const waiting = modules.filter((p) => moduleWaits(p));
    return html`<section class="fp3d-ext-card">
      <h3>${this.t("settings_modules")}</h3>
      ${this.summaryBar("modules", [
        { n: modules.length - pro, label: this.t("ext_sum_modules"), tone: "ok" },
        { n: pro, label: this.t("ext_sum_feature_packs"), tone: "missing" },
      ])}
      ${waiting.length
        ? html`<p class="fp3d-sub fp3d-module-waits">
            ${this.t("modules_waiting", { n: waiting.length })}
            ${waiting.map((p) => html`<button class="fp3d-btn fp3d-primary" @click=${() => void this.openReview(p)}>${packName(p, this.hass?.language ?? "de")}</button>`)}
          </p>`
        : nothing}
      ${!modules.length
        ? html`<p class="fp3d-sub">${this.t("modules_none")}</p>`
        : !this._open.has("modules")
          ? nothing
          : modules.map(
            (p) => html`<div class="fp3d-pack">
              <div>
                <b>${packName(p, this.hass?.language ?? "de")}</b>
                <span class="fp3d-sub">${p.module ? this.t("pack_module", { publisher: p.publisher }) : this.t((p.features ?? []).every((f) => f.startsWith("fun_")) ? "pack_fun_module" : "pack_pro_module", { publisher: p.publisher })}${p.release && p.release > 1 ? ` · v${p.release}` : ""}</span>
                ${(p.features ?? []).some((f) => !knownFeature(f)) ? html`<span class="fp3d-sub fp3d-pack-error">${this.t("pack_needs_update")}</span>` : nothing}
                ${p.module && p.module.approved !== true
                  ? html`<span class="fp3d-sub fp3d-module-waits">${this.t("module_waits")}</span>`
                  : p.pending
                    ? html`<span class="fp3d-sub fp3d-module-waits">${this.t("module_update_waits", { from: p.release ?? 1, to: p.pending.release })}</span>`
                    : nothing}
              </div>
              <div class="fp3d-module-actions">
                ${moduleWaits(p)
                  ? html`<button class="fp3d-btn fp3d-primary" @click=${() => void this.openReview(p)}>${this.t(p.module?.approved === true ? "module_review_update" : "module_review")}</button>`
                  : nothing}
                <button class="fp3d-btn fp3d-danger" @click=${() => this.deletePack(p)}>${this.t("pack_remove")}</button>
              </div>
            </div>`,
          )}
      ${this.renderReview()}
      <label class="fp3d-btn fp3d-primary fp3d-pack-import">
        ${this.t("module_import")}
        <input type="file" accept=".fp3dpack,.json,application/json" multiple hidden @change=${(e: Event) => this.importPackFile(e, true)} />
      </label>
      ${this._moduleMsg ? html`<p class="fp3d-sub ${this._moduleMsg.ok ? "fp3d-notice" : "fp3d-pack-error"}">${this._moduleMsg.text}</p>` : nothing}
      <p class="fp3d-sub">${this.t("module_import_hint")}</p>
    </section>`;
  }

  private async importPackFile(e: Event, modules = false): Promise<void> {
    const input = e.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = "";
    if (!files.length || !this.hass) return;
    const done: string[] = [];
    const failed: string[] = [];
    for (const file of files) {
      try {
        const res = await importPack(this.hass, await file.text());
        const text = this.t("pack_imported", { name: res.name, publisher: res.publisher, n: res.items });
        done.push(res.approval ? `${text} ${this.t("module_imported_waits")}` : text);
      } catch (err) {
        const { code, message } = (err ?? {}) as { code?: string; message?: string };
        const key = `pack_error_${code}` as I18nKey;
        const text = this.t(key, { detail: message ?? String(err) });
        failed.push(`${file.name}: ${text === key ? this.t("pack_error_other", { detail: message ?? String(err) }) : text}`);
      }
    }
    if (done.length) this.dispatchEvent(new CustomEvent("packs-changed", { bubbles: true, composed: true }));
    const summary = files.length > 1 ? [this.t("packs_imported_n", { n: done.length, total: files.length })] : [];
    const msg = { ok: failed.length === 0, text: [...summary, ...done, ...failed].join(" · ") };
    if (modules) this._moduleMsg = msg;
    else this._packMsg = msg;
  }

  /** Fetches the code an admin is asked to approve: the waiting update when there is one, else the installed code. */
  private async openReview(pack: FurniturePack): Promise<void> {
    if (!this.hass) return;
    this._open = new Set([...this._open, "modules"]);
    this._review = { pack, data: null, error: null, busy: true };
    void this.updateComplete.then(() => this.renderRoot.querySelector(".fp3d-review")?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    try {
      const data = await reviewModule(this.hass, pack.id, pack.module?.approved === true && !!pack.pending);
      this._review = { pack, data, error: null, busy: false };
    } catch (err) {
      const { code, message } = (err ?? {}) as { code?: string; message?: string };
      this._review = { pack, data: null, error: code === "unauthorized" ? this.t("module_review_admin") : (message ?? String(err)), busy: false };
    }
  }

  private async approveReview(): Promise<void> {
    const review = this._review;
    if (!this.hass || !review?.data) return;
    this._review = { ...review, busy: true };
    try {
      await approveModule(this.hass, review.pack.id, review.data.sha);
      this._review = null;
      this._moduleMsg = { ok: true, text: this.t("module_approved", { name: packName(review.pack, this.hass.language ?? "de") }) };
      this.dispatchEvent(new CustomEvent("packs-changed", { bubbles: true, composed: true }));
    } catch (err) {
      const { code, message } = (err ?? {}) as { code?: string; message?: string };
      this._review = { ...review, busy: false, error: code === "unauthorized" ? this.t("module_review_admin") : (message ?? String(err)) };
    }
  }

  /** The code to read before it runs: who made it, which version, how big, its fingerprint – and the code itself. */
  private renderReview() {
    const review = this._review;
    if (!review) return nothing;
    const d = review.data;
    return html`<div class="fp3d-review" role="dialog" aria-modal="true">
      <h4>${this.t("module_review_title", { name: packName(review.pack, this.hass?.language ?? "de") })}</h4>
      ${d
        ? html`<p class="fp3d-sub">${this.t("module_review_meta", { publisher: d.publisher, release: d.release, kb: Math.max(1, Math.round(d.code.length / 1024)), sha: d.sha })}</p>
            <p class="fp3d-sub">${this.t("module_review_note")}</p>
            <pre class="fp3d-review-code">${d.code}</pre>`
        : review.busy
          ? html`<p class="fp3d-sub">…</p>`
          : nothing}
      ${review.error ? html`<p class="fp3d-sub fp3d-pack-error">${review.error}</p>` : nothing}
      <div class="fp3d-module-actions">
        <button class="fp3d-btn" @click=${() => (this._review = null)}>${this.t("cancel")}</button>
        <button class="fp3d-btn fp3d-primary" ?disabled=${!d || review.busy} @click=${() => void this.approveReview()}>${this.t("module_approve")}</button>
      </div>
    </div>`;
  }

  private async deletePack(pack: FurniturePack): Promise<void> {
    if (!this.hass || !confirm(this.t("pack_remove_confirm", { name: packName(pack, this.hass?.language ?? "de") }))) return;
    await removePack(this.hass, pack.id);
    this._packMsg = null;
    this.dispatchEvent(new CustomEvent("packs-changed", { bubbles: true, composed: true }));
  }

  static styles = [
    tokens,
    controls,
    css`
      .fp3d-sum {
        display: grid;
        gap: 6px;
        width: 100%;
        margin: 4px 0 8px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--fp3d-line, rgba(120, 190, 255, 0.22));
        background: rgba(4, 8, 18, 0.35);
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .fp3d-sum-bar {
        display: flex;
        gap: 2px;
        height: 8px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(120, 190, 255, 0.12);
      }
      .fp3d-sum-bar i {
        display: block;
      }
      .fp3d-sum-ok {
        background: #34d399;
      }
      .fp3d-sum-update {
        background: #fbbf24;
      }
      .fp3d-sum-missing {
        background: #60a5fa;
      }
      .fp3d-sum-text {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 14px;
        font-size: 0.92em;
      }
      .fp3d-sum-ok-text {
        color: #34d399;
      }
      .fp3d-sum-update-text {
        color: #fbbf24;
      }
      .fp3d-sum-missing-text {
        color: #60a5fa;
      }
      .fp3d-sum-caret {
        color: var(--fp3d-muted, #8ea3c4);
        font-size: 0.85em;
      }
      .fp3d-sum-all {
        margin-bottom: 8px;
      }
      .fp3d-updates {
        border-color: color-mix(in srgb, var(--fp3d-accent) 60%, transparent);
        background: color-mix(in srgb, var(--fp3d-accent) 8%, transparent);
      }
      .fp3d-updates p {
        margin: 4px 0;
      }
      :host {
        display: block;
        overflow: auto;
      }
      .fp3d-ext {
        max-width: 920px;
        margin: 0 auto;
        padding: 20px 16px 40px;
        display: grid;
        gap: 16px;
      }
      .fp3d-ext-head {
        display: grid;
        gap: 8px;
        justify-items: start;
      }
      .fp3d-ext-head a {
        text-decoration: none;
      }
      .fp3d-ext-actions,
      .fp3d-ext-links {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }
      .fp3d-ext-head h2 {
        margin: 0;
        font-size: 22px;
      }
      .fp3d-ext-card {
        padding: 14px 16px;
        border: 1px solid var(--fp3d-line);
        border-radius: 14px;
        background: var(--fp3d-chrome);
      }
      .fp3d-ext-card h3 {
        margin: 0 0 8px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--fp3d-soft);
      }
      .fp3d-ext-pro {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 10px;
      }
      .fp3d-pet-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        margin-top: 6px;
      }
      .fp3d-pet-row input[type="text"],
      .fp3d-pet-row select {
        padding: 6px 10px;
        border-radius: 10px;
        border: 1px solid var(--fp3d-line, rgba(120, 190, 255, 0.25));
        background: rgba(4, 8, 18, 0.6);
        color: inherit;
        font: inherit;
      }
      .fp3d-pet-row input[type="text"] {
        flex: 1;
        min-width: 110px;
      }
      .fp3d-ext-feature {
        display: grid;
        gap: 6px;
        align-content: start;
        padding: 12px;
        border: 1px solid var(--fp3d-line);
        border-radius: 12px;
      }
      .fp3d-ext-on {
        border-color: var(--fp3d-accent);
      }
      .fp3d-ext-beta {
        border-style: dashed;
      }
      .fp3d-beta-tag {
        justify-self: start;
        padding: 2px 8px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--fp3d-accent) 18%, transparent);
        color: var(--fp3d-accent);
        font-size: 12px;
        font-weight: 700;
      }
      .fp3d-ext-state {
        color: var(--fp3d-accent);
        font-weight: 600;
        font-size: 13px;
      }
      .fp3d-ext-link {
        color: var(--fp3d-accent);
        font-weight: 600;
        font-size: 13px;
      }
      .fp3d-sub {
        color: var(--fp3d-soft);
        font-size: 13px;
      }
      .fp3d-notice {
        color: var(--fp3d-accent);
      }
      .fp3d-pack {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid var(--fp3d-line);
      }
      .fp3d-pack div {
        display: grid;
        gap: 2px;
      }
      .fp3d-pack-import {
        display: block;
        margin-top: 10px;
        text-align: center;
        cursor: pointer;
      }
      .fp3d-pack-error {
        color: var(--fp3d-danger);
      }
      .fp3d-module-waits {
        color: var(--fp3d-accent);
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
      }
      .fp3d-module-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
      }
      .fp3d-review {
        margin: 10px 0;
        padding: 12px;
        border: 1px solid var(--fp3d-accent);
        border-radius: 10px;
        display: grid;
        gap: 8px;
      }
      .fp3d-review h4 {
        margin: 0;
      }
      .fp3d-review .fp3d-sub {
        overflow-wrap: anywhere;
      }
      .fp3d-review-code {
        max-height: 50vh;
        overflow: auto;
        margin: 0;
        padding: 8px;
        font-size: 11px;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-word;
        background: rgba(0, 0, 0, 0.35);
        border-radius: 6px;
      }
    `,
  ];
}

if (!customElements.get("fp3d-extensions")) customElements.define("fp3d-extensions", Extensions);
