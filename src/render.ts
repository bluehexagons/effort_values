import { totalYield } from "./data.ts";
import { spriteForDex } from "./sprites.ts";
import {
  type Generation,
  type Pokemon,
  statCap,
  statLabels,
  statsForGeneration,
  totalCap,
  type Trainee,
} from "./types.ts";

export const escapeHtml = (value: string | number): string =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const icon = (
  name: "check" | "close" | "external" | "list" | "plus" | "trash",
): string => {
  const paths = {
    plus: "<path d='M12 5v14M5 12h14'/>",
    list: "<path d='M8 6h12M8 12h12M8 18h12'/><path d='M4 6h.01M4 12h.01M4 18h.01'/>",
    external: "<path d='M14 4h6v6M20 4l-9 9'/><path d='M18 13v7H4V6h7'/>",
    trash: "<path d='M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'/>",
    close: "<path d='M6 6l12 12M18 6 6 18'/>",
    check: "<path d='m5 12 4 4L19 6'/>",
  };
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
};
const bulbapediaUrl = (name: string): string =>
  `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(name.split(" (")[0] ?? name)}_(Pok%C3%A9mon)`;
const sprite = (pokemon: Pokemon): string => {
  const sheet = spriteForDex(pokemon.dex);
  if (!sheet)
    return '<span class="sprite-wrap no-sprite"><span class="sprite-fallback" aria-hidden="true">◈</span></span>';
  return `<span class="sprite-wrap"><span class="sprite-art"><img src="${sheet.url}" alt="" width="${sheet.width}" height="${sheet.height}" loading="lazy" decoding="async" style="left:-${sheet.x}px;top:-${sheet.y}px" /></span><span class="sprite-fallback" aria-hidden="true">◈</span></span>`;
};
const actionLabel = (generation: Generation, amount: number): string =>
  generation <= 2
    ? "Record battle"
    : `Add ${amount} EV${amount === 1 ? "" : "s"}`;
const pills = (pokemon: Pokemon, generation: Generation): string => {
  const values = statsForGeneration(generation).flatMap((stat) =>
    pokemon.evs[stat] > 0
      ? [
          `<span class="ev-pill">+${pokemon.evs[stat]} ${statLabels[stat]}</span>`,
        ]
      : [],
  );
  return values.join("") || '<span class="ev-pill zero-yield">No yield</span>';
};
const identity = (pokemon: Pokemon): string =>
  `${sprite(pokemon)}<div><strong>${escapeHtml(pokemon.name)}</strong><br /><small>#${pokemon.dex}</small></div>`;
export const renderResult = (
  pokemon: Pokemon,
  generation: Generation,
  dimmed: boolean,
  selected: boolean,
  saved = false,
): string => {
  const amount = totalYield(pokemon, generation);
  return `<article class="result-card${dimmed ? " dim" : ""}" data-id="${pokemon.id}" draggable="true">
    <div class="result-identity">${identity(pokemon)}</div><div class="result-actions">
    <button type="button" data-action="reference" data-id="${pokemon.id}" aria-label="${saved ? `${escapeHtml(pokemon.name)} saved for later` : `Save ${escapeHtml(pokemon.name)} for later`}"${saved ? " disabled" : ""}>${icon(saved ? "check" : "plus")} ${saved ? "Saved" : "Save"}</button>
    <button type="button" class="primary-action yield-action" data-action="yield" data-id="${pokemon.id}"${selected ? "" : " disabled"}>${icon("plus")} ${actionLabel(generation, amount)}</button>
    <button type="button" data-action="details" data-id="${pokemon.id}">Details</button></div><div class="ev-pills">${pills(pokemon, generation)}</div></article>`;
};
export const renderQuickReference = (
  pokemon: readonly Pokemon[],
  generation: Generation,
  selected: boolean,
): string => {
  const cards = pokemon
    .map(
      (entry) =>
        `<article class="quick-card" data-id="${entry.id}" draggable="true"><div class="quick-meta"><div class="quick-identity">${identity(entry)}</div><button type="button" class="icon-button" data-action="remove-reference" data-id="${entry.id}" aria-label="Remove ${escapeHtml(entry.name)} from saved Pokémon">${icon("trash")}</button></div><div class="ev-pills">${pills(entry, generation)}</div><div class="quick-actions"><button type="button" class="primary-action yield-action" data-action="yield" data-id="${entry.id}"${selected ? "" : " disabled"}>${icon("plus")} ${actionLabel(generation, totalYield(entry, generation))}</button><a class="text-link" href="${bulbapediaUrl(entry.name)}" target="_blank" rel="noopener noreferrer">Bulbapedia ${icon("external")}</a></div></article>`,
    )
    .join("");
  return `<div class="panel-title"><span>${icon("list")} Saved Pokémon</span><small>Quick access</small></div>${cards || '<div class="empty-state"><strong>No saved Pokémon yet.</strong><br />Choose Save on a result to keep it here.</div>'}${cards ? `<div class="panel-footer"><button type="button" class="quiet-button" data-action="clear-reference">${icon("trash")} Clear saved list</button></div>` : ""}`;
};
export const renderTracker = (
  trainees: readonly Trainee[],
  selectedId: string | null,
  generation: Generation,
): string => {
  const cap = statCap(generation);
  const cards = trainees
    .map((trainee) => {
      const selected = trainee.id === selectedId;
      const fields = statsForGeneration(generation)
        .map(
          (stat) =>
            `<label class="tracker-field"><span>${statLabels[stat]}</span><input type="number" inputmode="numeric" min="0" max="${cap}" value="${trainee.evs[stat]}" data-field="${stat}" /></label>`,
        )
        .join("");
      const total = statsForGeneration(generation).reduce(
        (sum, stat) => sum + trainee.evs[stat],
        0,
      );
      const totalText =
        generation <= 2
          ? `Up to ${cap.toLocaleString()} per stat`
          : `${total} / 510 EVs`;
      return `<article class="tracker-entry${selected ? " selected" : ""}" data-trainee-id="${escapeHtml(trainee.id)}"><div class="tracker-head"><input class="trainee-name" type="text" value="${escapeHtml(trainee.name)}" maxlength="40" placeholder="Trainee name" aria-label="Trainee name" data-field="name" /><button type="button" class="icon-button danger-button" data-action="remove-trainee" aria-label="Remove trainee">${icon("trash")}</button></div><div class="tracker-selection"><button type="button" class="select-trainee" data-action="select-trainee" aria-pressed="${selected}">${selected ? `${icon("check")} Selected trainee` : "Select trainee"}</button><span class="tracker-total${totalCap(generation) !== null && total > 510 ? " over-limit" : ""}">${totalText}</span></div><div class="tracker-fields">${fields}</div><div class="tracker-row-actions"><button type="button" class="text-button" data-action="reset-trainee">Reset ${generation <= 2 ? "stat experience" : "EVs"}</button></div></article>`;
    })
    .join("");
  return `<div class="panel-title"><span>${icon("list")} Trainees</span><small>Select who receives yields</small></div>${cards || `<div class="empty-state"><strong>No trainees yet.</strong><br />Use Add trainee above to start tracking ${generation <= 2 ? "stat experience" : "EVs"}.</div>`}`;
};
export const renderDetails = (
  pokemon: Pokemon,
  generation: Generation,
): string =>
  `<div class="info-card"><div class="panel-title"><span id="details-title" class="quick-identity">${sprite(pokemon)} ${escapeHtml(pokemon.name)}</span><button type="button" data-action="close-details" aria-label="Close details">${icon("close")}</button></div><div class="detail-summary"><p><strong>Generation ${generation}</strong> · ${generation <= 2 ? "Base stats awarded as stat experience" : `${totalYield(pokemon, generation)} total EVs per battle`}</p><div class="ev-pills">${pills(pokemon, generation)}</div></div><p><a href="${bulbapediaUrl(pokemon.name)}" target="_blank" rel="noopener noreferrer">${escapeHtml(pokemon.name)} on Bulbapedia ${icon("external")}</a></p></div>`;
