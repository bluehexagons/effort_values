import { byId, setInput } from "./dom.ts";
import { generationNote } from "./generation.ts";
import {
  escapeHtml,
  renderQuickReference,
  renderResult,
  renderTracker,
} from "./render.ts";
import { matchesPokemon, sortPokemon } from "./search.ts";
import { statLabels, statsForGeneration } from "./types.ts";
import type { App } from "./app.ts";

export const syncControls = (app: App): void => {
  setInput("search", app.state.query);
  setInput("within-filter", app.state.matchAnywhere);
  setInput("showall", app.state.showNonMatches);
  setInput("byev", app.state.filterEnabled);
  setInput("loadall", app.state.showAllWhenEmpty);
  setInput("generation", String(app.state.generation));
  renderGenerationControls(app);
  byId("evform").hidden = !app.state.filterEnabled;
  updateFilterDisclosure(app, true);
  updateSortDirection(app);
};

export const activeFilterCount = (app: App): number =>
  statsForGeneration(app.state.generation).filter(
    (key) => app.state.filters[key].trim() !== "",
  ).length;

export const updateFilterDisclosure = (
  app: App,
  revealActive = false,
): void => {
  const options = byId("ev-options");
  const button = byId<HTMLButtonElement>("toggle-filter-fields");
  const count = activeFilterCount(app);
  if (!app.state.filterEnabled) options.classList.remove("filter-expanded");
  else if (revealActive && count > 0) options.classList.add("filter-expanded");
  const expanded = options.classList.contains("filter-expanded");
  button.disabled = !app.state.filterEnabled;
  button.hidden = !app.state.filterEnabled;
  button.textContent = `${expanded ? "Hide" : "Edit"} filters${count > 0 ? ` (${count})` : ""}`;
  button.setAttribute("aria-expanded", String(expanded));
};

export const updateSortDirection = (app: App): void => {
  const button = byId<HTMLButtonElement>("reverse-sort");
  const direction = app.state.sortDescending ? "descending" : "ascending";
  const nextDirection = app.state.sortDescending ? "ascending" : "descending";
  button.textContent = app.state.sortDescending ? "↓" : "↑";
  button.title = `Currently ${direction}; change to ${nextDirection}`;
  button.setAttribute(
    "aria-label",
    `Currently sorted ${direction}; change to ${nextDirection}`,
  );
};

const updateSelectedSummary = (app: App): void => {
  const selected = app.selectedTrainee();
  const summary = byId("selected-trainee-summary");
  summary.textContent = selected
    ? `Adding to: ${selected.name || "Unnamed trainee"}`
    : "Add a trainee to track yields";
  summary.classList.toggle("has-selection", Boolean(selected));
};

export const renderApp = (app: App): void => {
  const sorted = sortPokemon(app.pokemon, app.state);
  const matching = sorted.filter((entry) => matchesPokemon(entry, app.state));
  const matchingIds = new Set(matching.map(({ id }) => id));
  const visible = app.state.showNonMatches ? sorted : matching;
  const noResultsMessage =
    app.state.query.trim() === "" &&
    (!app.state.filterEnabled || activeFilterCount(app) === 0)
      ? app.state.filterEnabled
        ? '<div class="empty-state"><strong>Enter a yield value.</strong><br />Choose a stat above, or search by Pokémon name.</div>'
        : '<div class="empty-state"><strong>Start with a search.</strong><br />Enter a Pokémon name or turn on yield filters to find battle sources.</div>'
      : '<div class="empty-state"><strong>No matching Pokémon.</strong><br />Try a broader name or clear a yield filter.</div>';
  byId("count").textContent = String(matching.length);
  byId("result-list").innerHTML = visible.length
    ? visible
        .map((entry) =>
          renderResult(
            entry,
            app.state.generation,
            !matchingIds.has(entry.id),
            Boolean(app.selectedTrainee()),
            app.state.quickReference.includes(entry.id),
          ),
        )
        .join("")
    : noResultsMessage;
  const references = app.state.quickReference.flatMap(
    (id) => app.pokemonById(id) ?? [],
  );
  byId("quickchart").innerHTML = renderQuickReference(
    references,
    app.state.generation,
    Boolean(app.selectedTrainee()),
  );
  byId("evtracker").innerHTML = renderTracker(
    app.state.trainees,
    app.state.selectedTraineeId,
    app.state.generation,
  );
  updateSelectedSummary(app);
};

export const updateSelectionUi = (app: App): void => {
  const selected = app.selectedTrainee();
  for (const card of byId("evtracker").querySelectorAll<HTMLElement>(
    "[data-trainee-id]",
  )) {
    const isSelected = card.dataset.traineeId === app.state.selectedTraineeId;
    card.classList.toggle("selected", isSelected);
    const button = card.querySelector<HTMLButtonElement>(".select-trainee");
    if (button) {
      button.setAttribute("aria-pressed", String(isSelected));
      button.textContent = isSelected ? "✓ Selected trainee" : "Select trainee";
    }
  }
  for (const action of document.querySelectorAll<HTMLButtonElement>(
    ".yield-action",
  )) {
    action.disabled = !selected;
  }
  updateSelectedSummary(app);
};

export const renderGenerationControls = (app: App): void => {
  const stats = statsForGeneration(app.state.generation);
  byId("filter-grid").innerHTML =
    stats
      .map(
        (stat) =>
          `<label><span>${statLabels[stat]}</span><input data-filter="${stat}" type="text" maxlength="8" value="${escapeHtml(app.state.filters[stat])}" /></label>`,
      )
      .join("") +
    '<button id="clear-filters" type="button" class="quiet-button clear-filters">Clear yield filters</button>';
  byId("result-sort").innerHTML =
    '<option value="dex">Pokédex #</option><option value="name">Name</option>' +
    stats
      .map((stat) => `<option value="${stat}">${statLabels[stat]}</option>`)
      .join("");
  setInput("result-sort", app.state.sortKey);
  byId("generation-note").textContent = generationNote(app.state.generation);
};
