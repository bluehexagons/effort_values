import "./styles.css";
import { loadPokemon, primaryPokemon } from "./data.ts";
import {
  renderDetails,
  renderQuickReference,
  renderResult,
  renderTracker,
} from "./render.ts";
import { matchesPokemon, sortPokemon } from "./search.ts";
import { encodeState, loadState, STORAGE_KEY, saveState } from "./storage.ts";
import {
  type AppState,
  defaultState,
  emptyEvs,
  type Pokemon,
  type SortKey,
  statKeys,
  type Trainee,
  type YieldFilters,
} from "./types.ts";

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing #${id}`);
  return element as T;
};

let state: AppState = defaultState();
let pokemon: Pokemon[] = [];
let primary: Pokemon[] = [];
let saveTimer: number | undefined;

const pokemonByDex = (dex: string): Pokemon | undefined =>
  primary.find((entry) => entry.dex === dex);
const traineeById = (id: string): Trainee | undefined =>
  state.trainees.find((entry) => entry.id === id);
const selectedTrainee = (): Trainee | undefined =>
  state.selectedTraineeId ? traineeById(state.selectedTraineeId) : undefined;

const status = (message: string): void => {
  byId("save-status").textContent = message;
};

const persistSoon = (): void => {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      saveState(state);
    } catch {
      status("Local saving is unavailable");
    }
  }, 200);
};

const setInput = (id: string, value: string | boolean): void => {
  const input = byId<HTMLInputElement>(id);
  if (typeof value === "boolean") input.checked = value;
  else input.value = value;
};

const syncControls = (): void => {
  setInput("search", state.query);
  setInput("within-filter", state.matchAnywhere);
  setInput("showall", state.showNonMatches);
  setInput("byev", state.filterEnabled);
  setInput("loadall", state.showAllWhenEmpty);
  setInput("result-sort", state.sortKey);
  setInput("exp", state.filters.exp);
  statKeys.forEach((stat) => {
    setInput(statToInput[stat], state.filters[stat]);
  });
  byId("evform").hidden = !state.filterEnabled;
  updateSortDirection();
};

const updateSortDirection = (): void => {
  const button = byId<HTMLButtonElement>("reverse-sort");
  const direction = state.sortDescending ? "descending" : "ascending";
  const nextDirection = state.sortDescending ? "ascending" : "descending";
  button.textContent = state.sortDescending ? "↓" : "↑";
  button.title = `Currently ${direction}; change to ${nextDirection}`;
  button.setAttribute(
    "aria-label",
    `Currently sorted ${direction}; change to ${nextDirection}`,
  );
};

const render = (): void => {
  const sorted = sortPokemon(primary, state);
  const matching = sorted.filter((entry) => matchesPokemon(entry, state));
  const visible = state.showNonMatches ? sorted : matching;
  byId("count").textContent = String(matching.length);
  byId("result-list").innerHTML = visible.length
    ? visible
        .map((entry) =>
          renderResult(
            entry,
            !matchesPokemon(entry, state),
            Boolean(selectedTrainee()),
          ),
        )
        .join("")
    : '<div class="empty-state"><strong>No matching Pokémon.</strong><br />Try a broader name or clear a yield filter.</div>';
  const references = state.quickReference.flatMap(
    (dex) => pokemonByDex(dex) ?? [],
  );
  byId("quickchart").innerHTML = renderQuickReference(
    references,
    Boolean(selectedTrainee()),
  );
  byId("evtracker").innerHTML = renderTracker(
    state.trainees,
    state.selectedTraineeId,
  );
  const selected = selectedTrainee();
  const summary = byId("selected-trainee-summary");
  summary.textContent = selected
    ? `Adding to: ${selected.name || "Unnamed trainee"}`
    : "Select a trainee to add yields";
  summary.classList.toggle("has-selection", Boolean(selected));
};

const updateAndRender = (): void => {
  render();
  updateSortDirection();
  persistSoon();
};

const updateSelectionUi = (): void => {
  const selected = selectedTrainee();
  for (const card of byId("evtracker").querySelectorAll<HTMLElement>(
    "[data-trainee-id]",
  )) {
    const isSelected = card.dataset.traineeId === state.selectedTraineeId;
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
  const summary = byId("selected-trainee-summary");
  summary.textContent = selected
    ? `Adding to: ${selected.name || "Unnamed trainee"}`
    : "Select a trainee to add yields";
  summary.classList.toggle("has-selection", Boolean(selected));
};

const addReference = (dex: string): void => {
  const entry = pokemonByDex(dex);
  if (!entry) return;
  if (state.quickReference.includes(dex)) {
    status(`${entry.name} is already in Quick Reference`);
    return;
  }
  state.quickReference.push(dex);
  updateAndRender();
  status(`${entry.name} added to Quick Reference`);
};

const addYield = (dex: string): void => {
  const entry = pokemonByDex(dex);
  const trainee = selectedTrainee();
  if (!entry || !trainee) {
    status("Select a trainee before adding a battle yield");
    return;
  }
  for (const stat of statKeys)
    trainee.evs[stat] = Math.min(9999, trainee.evs[stat] + entry.evs[stat]);
  updateAndRender();
  status(`${entry.name}'s yield added to ${trainee.name || "unnamed trainee"}`);
};

const newTrainee = (): Trainee => ({
  id: crypto.randomUUID(),
  name: "",
  evs: emptyEvs(),
});

const showDetails = (dex: string): void => {
  const entry = pokemonByDex(dex);
  if (!entry) return;
  const forms = pokemon.filter(
    (candidate) => candidate.dex === dex && candidate.name.includes("("),
  );
  byId("details-content").innerHTML = renderDetails(entry, forms);
  byId<HTMLDialogElement>("details-dialog").showModal();
};

const handleAction = (button: HTMLElement): void => {
  const action = button.dataset.action;
  const dex = button.dataset.dex;
  const card = button.closest<HTMLElement>("[data-trainee-id]");
  const trainee = card?.dataset.traineeId
    ? traineeById(card.dataset.traineeId)
    : undefined;
  if (action === "reference" && dex) addReference(dex);
  if (action === "yield" && dex) addYield(dex);
  if (action === "details" && dex) showDetails(dex);
  if (action === "remove-reference" && dex) {
    state.quickReference = state.quickReference.filter(
      (entry) => entry !== dex,
    );
    updateAndRender();
  }
  if (action === "clear-reference") {
    state.quickReference = [];
    updateAndRender();
  }
  if (action === "add-trainee") {
    const added = newTrainee();
    state.trainees.push(added);
    state.selectedTraineeId = added.id;
    updateAndRender();
    byId("evtracker")
      .querySelector<HTMLInputElement>(`[data-trainee-id="${added.id}"] input`)
      ?.focus();
  }
  if (action === "select-trainee" && trainee) {
    state.selectedTraineeId = trainee.id;
    updateAndRender();
    status(`${trainee.name || "Trainee"} selected`);
  }
  if (action === "remove-trainee" && trainee) {
    state.trainees = state.trainees.filter(({ id }) => id !== trainee.id);
    if (state.selectedTraineeId === trainee.id)
      state.selectedTraineeId = state.trainees[0]?.id ?? null;
    updateAndRender();
  }
  if (
    action === "reset-trainee" &&
    trainee &&
    window.confirm(`Reset all EV totals for ${trainee.name || "this trainee"}?`)
  ) {
    trainee.evs = emptyEvs();
    updateAndRender();
  }
  if (action === "close-details")
    byId<HTMLDialogElement>("details-dialog").close();
};

const bindDelegatedEvents = (): void => {
  document.addEventListener(
    "error",
    (event) => {
      const image = event.target;
      if (
        !(image instanceof HTMLImageElement) ||
        !image.matches(".sprite-wrap img")
      )
        return;
      image.hidden = true;
      const fallback = image.nextElementSibling;
      if (fallback instanceof HTMLElement)
        fallback.style.display = "inline-flex";
    },
    true,
  );
  document.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLElement>(
      "[data-action]",
    );
    if (button) handleAction(button);
  });
  document.addEventListener("dragstart", (event) => {
    const card = (event.target as Element).closest<HTMLElement>(
      "[data-dex][draggable=true]",
    );
    if (card?.dataset.dex && event.dataTransfer)
      event.dataTransfer.setData("text/plain", card.dataset.dex);
  });
  for (const [id, onDrop] of [
    ["quickchart", addReference],
    ["evtracker", addYield],
  ] as const) {
    const target = byId(id);
    target.addEventListener("dragover", (event) => {
      event.preventDefault();
      target.classList.add("drop-target");
    });
    target.addEventListener("dragleave", () =>
      target.classList.remove("drop-target"),
    );
    target.addEventListener("drop", (event) => {
      event.preventDefault();
      target.classList.remove("drop-target");
      onDrop(event.dataTransfer?.getData("text/plain") ?? "");
    });
  }
};

const statToInput = {
  hp: "hp",
  attack: "atk",
  defense: "def",
  specialAttack: "sat",
  specialDefense: "sdf",
  speed: "spd",
} as const;

const bindControls = (): void => {
  byId<HTMLInputElement>("search").addEventListener("input", (event) => {
    state.query = (event.currentTarget as HTMLInputElement).value;
    updateAndRender();
  });
  byId<HTMLInputElement>("within-filter").addEventListener(
    "change",
    (event) => {
      state.matchAnywhere = (event.currentTarget as HTMLInputElement).checked;
      updateAndRender();
    },
  );
  byId<HTMLInputElement>("showall").addEventListener("change", (event) => {
    state.showNonMatches = (event.currentTarget as HTMLInputElement).checked;
    updateAndRender();
  });
  byId<HTMLInputElement>("loadall").addEventListener("change", (event) => {
    state.showAllWhenEmpty = (event.currentTarget as HTMLInputElement).checked;
    updateAndRender();
  });
  byId<HTMLInputElement>("byev").addEventListener("change", (event) => {
    state.filterEnabled = (event.currentTarget as HTMLInputElement).checked;
    byId("evform").hidden = !state.filterEnabled;
    updateAndRender();
  });
  byId<HTMLSelectElement>("result-sort").addEventListener("change", (event) => {
    state.sortKey = (event.currentTarget as HTMLSelectElement).value as SortKey;
    state.sortDescending = false;
    updateAndRender();
  });
  byId("reverse-sort").addEventListener("click", () => {
    state.sortDescending = !state.sortDescending;
    updateAndRender();
  });
  const filterInputs: [string, keyof YieldFilters][] = [
    ["exp", "exp"],
    ...statKeys.map(
      (stat) => [statToInput[stat], stat] as [string, keyof YieldFilters],
    ),
  ];
  for (const [id, key] of filterInputs)
    byId<HTMLInputElement>(id).addEventListener("input", (event) => {
      const input = event.currentTarget as HTMLInputElement;
      state.filters[key] = input.value;
      input.setAttribute(
        "aria-invalid",
        /^(?:\*|\d+[+-]?)?$/.test(input.value.trim()) ? "false" : "true",
      );
      updateAndRender();
    });
  byId("clear-filters").addEventListener("click", () => {
    for (const [, key] of filterInputs) state.filters[key] = "";
    syncControls();
    updateAndRender();
  });
  byId("toggle-filter-fields").addEventListener("click", () => {
    const options = byId("ev-options");
    const expanded = options.classList.toggle("filter-expanded");
    byId("toggle-filter-fields").setAttribute(
      "aria-expanded",
      String(expanded),
    );
  });
  byId("share-state").addEventListener("click", async () => {
    const url = `${window.location.href.split("#")[0]}#state=${encodeState(state)}`;
    history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      status("Share link copied");
    } catch {
      status("Share link ready in the address bar");
    }
  });
  byId("reset-state").addEventListener("click", () => {
    if (
      !window.confirm(
        "Clear saved trainees, reference Pokémon, and settings on this device?",
      )
    )
      return;
    localStorage.removeItem(STORAGE_KEY);
    history.replaceState(null, "", window.location.href.split("#")[0]);
    state = defaultState();
    syncControls();
    updateAndRender();
    status("Saved data cleared");
  });
  byId("evtracker").addEventListener("focusin", (event) => {
    const card = (event.target as Element).closest<HTMLElement>(
      "[data-trainee-id]",
    );
    if (
      card?.dataset.traineeId &&
      state.selectedTraineeId !== card.dataset.traineeId
    ) {
      state.selectedTraineeId = card.dataset.traineeId;
      updateSelectionUi();
      persistSoon();
    }
  });
  byId("evtracker").addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement;
    const id =
      input.closest<HTMLElement>("[data-trainee-id]")?.dataset.traineeId;
    const trainee = id ? traineeById(id) : undefined;
    if (!trainee) return;
    if (input.dataset.field === "name")
      trainee.name = input.value.replaceAll(/[\\/]/g, "").slice(0, 40);
    else if (
      input.dataset.field &&
      statKeys.includes(input.dataset.field as (typeof statKeys)[number])
    )
      trainee.evs[input.dataset.field as (typeof statKeys)[number]] = Math.max(
        0,
        Math.min(9999, Number.parseInt(input.value, 10) || 0),
      );
    persistSoon();
    const total = statKeys.reduce((sum, stat) => sum + trainee.evs[stat], 0);
    const totalElement = input
      .closest(".tracker-entry")
      ?.querySelector(".tracker-total");
    if (totalElement) {
      totalElement.textContent = `${total} total EVs`;
      totalElement.classList.toggle("over-limit", total > 510);
    }
    if (state.selectedTraineeId === trainee.id)
      byId("selected-trainee-summary").textContent =
        `Adding to: ${trainee.name || "Unnamed trainee"}`;
  });
  const dialog = byId<HTMLDialogElement>("details-dialog");
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement;
    const isTyping = target.matches(
      "input, textarea, select, [contenteditable=true]",
    );
    if (
      event.key === "/" &&
      !isTyping &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      byId<HTMLInputElement>("search").focus();
    }
  });
};

const start = async (): Promise<void> => {
  bindDelegatedEvents();
  bindControls();
  try {
    pokemon = await loadPokemon();
    primary = primaryPokemon(pokemon);
    const loaded = loadState();
    state = loaded.state;
    const knownDex = new Set(primary.map(({ dex }) => dex));
    state.quickReference = state.quickReference.filter((dex) =>
      knownDex.has(dex),
    );
    syncControls();
    render();
    status(
      loaded.fromLink
        ? "Shared setup loaded"
        : "Ready — changes save automatically",
    );
    persistSoon();
  } catch (error) {
    console.error(error);
    byId("result-list").innerHTML =
      '<div class="empty-state"><strong>Could not load Pokémon data.</strong><br />Refresh the page to try again.</div>';
    status("Data failed to load");
  }
};

void start();
