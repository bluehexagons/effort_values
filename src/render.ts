import { spriteUrl, totalYield } from "./data.ts";
import { type Pokemon, statKeys, type Trainee } from "./types.ts";

const labels: Record<(typeof statKeys)[number], string> = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  specialAttack: "Sp. Atk",
  specialDefense: "Sp. Def",
  speed: "Speed",
};

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
  `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(name)}_(Pok%C3%A9mon)`;

const sprite = (pokemon: Pokemon): string =>
  `<span class="sprite-wrap"><img src="${spriteUrl(pokemon)}" alt="" width="32" height="32" loading="lazy" decoding="async" /><span class="sprite-fallback" aria-hidden="true">◈</span></span>`;

const pills = (pokemon: Pokemon): string => {
  const values = statKeys.flatMap((stat) =>
    pokemon.evs[stat] > 0
      ? [`<span class="ev-pill">+${pokemon.evs[stat]} ${labels[stat]}</span>`]
      : [],
  );
  return (
    values.join("") || '<span class="ev-pill zero-yield">No EV yield</span>'
  );
};

export const renderResult = (
  pokemon: Pokemon,
  dimmed: boolean,
  selected: boolean,
): string => {
  const total = totalYield(pokemon);
  return `<article class="result-card${dimmed ? " dim" : ""}" data-dex="${pokemon.dex}" draggable="true">
    <div class="result-identity">${sprite(pokemon)}<div><strong>${escapeHtml(pokemon.name)}</strong><br /><small>#${pokemon.dex} · ${pokemon.exp} EXP</small></div></div>
    <div class="result-actions">
      <button type="button" data-action="reference" data-dex="${pokemon.dex}">${icon("plus")} Reference</button>
      <button type="button" class="primary-action yield-action" data-action="yield" data-dex="${pokemon.dex}"${selected ? "" : " disabled"}>${icon("plus")} Add ${total} EV${total === 1 ? "" : "s"}</button>
      <button type="button" data-action="details" data-dex="${pokemon.dex}">Details</button>
    </div>
    <div class="ev-pills">${pills(pokemon)}</div>
  </article>`;
};

export const renderQuickReference = (
  pokemon: readonly Pokemon[],
  selected: boolean,
): string => {
  const cards = pokemon
    .map((entry) => {
      const total = totalYield(entry);
      return `<article class="quick-card" data-dex="${entry.dex}" draggable="true">
      <div class="quick-meta"><div class="quick-identity">${sprite(entry)}<div><strong>${escapeHtml(entry.name)}</strong><br /><small>#${entry.dex} · ${entry.exp} EXP</small></div></div><button type="button" class="icon-button" data-action="remove-reference" data-dex="${entry.dex}" aria-label="Remove ${escapeHtml(entry.name)}">${icon("trash")}</button></div>
      <div class="ev-pills">${pills(entry)}</div>
      <div class="quick-actions"><button type="button" class="primary-action yield-action" data-action="yield" data-dex="${entry.dex}"${selected ? "" : " disabled"}>${icon("plus")} Add ${total} EV${total === 1 ? "" : "s"}</button><a class="text-link" href="${bulbapediaUrl(entry.name)}" target="_blank" rel="noopener noreferrer">Bulbapedia ${icon("external")}</a></div>
    </article>`;
    })
    .join("");
  return `<div class="panel-title"><span>${icon("list")} Quick Reference</span><small>Battle yields</small></div>
    ${cards || '<div class="empty-state"><strong>No reference Pokémon yet.</strong><br />Use Reference on a result to keep its yield handy.</div>'}
    ${cards ? `<div class="panel-footer"><button type="button" class="quiet-button" data-action="clear-reference">${icon("trash")} Clear reference</button></div>` : ""}`;
};

export const renderTracker = (
  trainees: readonly Trainee[],
  selectedId: string | null,
): string => {
  const cards = trainees
    .map((trainee) => {
      const selected = trainee.id === selectedId;
      const fields = statKeys
        .map(
          (stat) =>
            `<label class="tracker-field"><span>${labels[stat]}</span><input type="number" inputmode="numeric" min="0" max="9999" value="${trainee.evs[stat]}" data-field="${stat}" /></label>`,
        )
        .join("");
      const total = statKeys.reduce((sum, stat) => sum + trainee.evs[stat], 0);
      return `<article class="tracker-entry${selected ? " selected" : ""}" data-trainee-id="${escapeHtml(trainee.id)}">
      <div class="tracker-head"><input class="trainee-name" type="text" value="${escapeHtml(trainee.name)}" placeholder="Trainee name" aria-label="Trainee name" data-field="name" /><button type="button" class="icon-button danger-button" data-action="remove-trainee" aria-label="Remove trainee">${icon("trash")}</button></div>
      <div class="tracker-selection"><button type="button" class="select-trainee" data-action="select-trainee" aria-pressed="${selected}">${selected ? `${icon("check")} Selected trainee` : "Select trainee"}</button><span class="tracker-total${total > 510 ? " over-limit" : ""}">${total} total EVs</span></div>
      <div class="tracker-fields">${fields}</div><div class="tracker-row-actions"><button type="button" class="text-button" data-action="reset-trainee">Reset EVs</button></div>
    </article>`;
    })
    .join("");
  return `<div class="panel-title"><span>${icon("list")} Training Tracker</span><small>Select who receives yields</small></div>
    ${cards || '<div class="empty-state"><strong>No trainees yet.</strong><br />Add a row, name the Pokémon you are training, then select it.</div>'}
    <div class="panel-footer"><button type="button" class="primary-action" data-action="add-trainee">${icon("plus")} Add trainee</button></div>`;
};

export const renderDetails = (
  pokemon: Pokemon,
  forms: readonly Pokemon[],
): string => {
  const formCards = forms
    .map(
      (form) =>
        `<div class="detail-form"><strong>${escapeHtml(form.name)}</strong><div class="ev-pills">${pills(form)}</div></div>`,
    )
    .join("");
  return `<div class="info-card"><div class="panel-title"><span class="quick-identity">${sprite(pokemon)} ${escapeHtml(pokemon.name)}</span><button type="button" data-action="close-details" aria-label="Close details">${icon("close")}</button></div>
    <div class="detail-summary"><p><strong>${pokemon.exp} EXP</strong> · ${totalYield(pokemon)} total EVs</p><div class="ev-pills">${pills(pokemon)}</div></div>
    ${formCards ? `<h3>Special forms</h3>${formCards}` : ""}
    <p><a href="${bulbapediaUrl(pokemon.name)}" target="_blank" rel="noopener noreferrer">${escapeHtml(pokemon.name)} on Bulbapedia ${icon("external")}</a></p></div>`;
};
