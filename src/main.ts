// oxlint-disable-next-line import/no-unassigned-import -- Vite bundles this stylesheet for its side effect.
import "./styles.css";
import { loadPokemon } from "./data.ts";
import {
  renderDetails,
  renderQuickReference,
  renderResult,
  renderTracker,
} from "./render.ts";
import { matchesPokemon, sortPokemon } from "./search.ts";
import {
  clearStoredState,
  encodeState,
  loadState,
  loadGenerationState,
  saveState,
} from "./storage.ts";
import {
  type AppState,
  defaultState,
  emptyEvs,
  MAX_QUICK_REFERENCE,
  MAX_TRAINEES,
  type Pokemon,
  type SortKey,
  statKeys,
  statCap,
  statLabels,
  statsForGeneration,
  type Generation,
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

let saveTimer: number | undefined;

const pokemonById = (id: string): Pokemon | undefined =>
  pokemon.find((entry) => entry.id === id);
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
  setInput("generation", String(state.generation));
  renderGenerationControls();
  byId("evform").hidden = !state.filterEnabled;
  updateFilterDisclosure(true);
  updateSortDirection();
};

const activeFilterCount = (): number =>
  statsForGeneration(state.generation).filter(
    (key) => state.filters[key].trim() !== "",
  ).length;

const updateFilterDisclosure = (revealActive = false): void => {
  const options = byId("ev-options");
  const button = byId<HTMLButtonElement>("toggle-filter-fields");
  const count = activeFilterCount();
  if (!state.filterEnabled) options.classList.remove("filter-expanded");
  else if (revealActive && count > 0) options.classList.add("filter-expanded");
  const expanded = options.classList.contains("filter-expanded");
  button.disabled = !state.filterEnabled;
  button.hidden = !state.filterEnabled;
  button.textContent = `${expanded ? "Hide" : "Edit"} filters${count > 0 ? ` (${count})` : ""}`;
  button.setAttribute("aria-expanded", String(expanded));
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
  const sorted = sortPokemon(pokemon, state);
  const matching = sorted.filter((entry) => matchesPokemon(entry, state));
  const visible = state.showNonMatches ? sorted : matching;
  const noResultsMessage =
    state.query.trim() === "" &&
    (!state.filterEnabled || activeFilterCount() === 0)
      ? state.filterEnabled
        ? '<div class="empty-state"><strong>Enter a yield value.</strong><br />Choose a stat above, or search by Pokémon name.</div>'
        : '<div class="empty-state"><strong>Start with a search.</strong><br />Enter a Pokémon name or turn on yield filters to find battle sources.</div>'
      : '<div class="empty-state"><strong>No matching Pokémon.</strong><br />Try a broader name or clear a yield filter.</div>';
  byId("count").textContent = String(matching.length);
  byId("result-list").innerHTML = visible.length
    ? visible
        .map((entry) =>
          renderResult(
            entry,
            state.generation,
            !matchesPokemon(entry, state),
            Boolean(selectedTrainee()),
            state.quickReference.includes(entry.id),
          ),
        )
        .join("")
    : noResultsMessage;
  const references = state.quickReference.flatMap(
    (id) => pokemonById(id) ?? [],
  );
  byId("quickchart").innerHTML = renderQuickReference(
    references,
    state.generation,
    Boolean(selectedTrainee()),
  );
  byId("evtracker").innerHTML = renderTracker(
    state.trainees,
    state.selectedTraineeId,
    state.generation,
  );
  const selected = selectedTrainee();
  const summary = byId("selected-trainee-summary");
  summary.textContent = selected
    ? `Adding to: ${selected.name || "Unnamed trainee"}`
    : "Add a trainee to track yields";
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
    : "Add a trainee to track yields";
  summary.classList.toggle("has-selection", Boolean(selected));
};

const addReference = (id: string): void => {
  const entry = pokemonById(id);
  if (!entry) return;
  if (state.quickReference.includes(id)) {
    status(`${entry.name} is already saved`);
    return;
  }
  if (state.quickReference.length >= MAX_QUICK_REFERENCE) {
    status(`The saved list is limited to ${MAX_QUICK_REFERENCE} Pokémon`);
    return;
  }
  state.quickReference.push(id);
  updateAndRender();
  status(`${entry.name} saved for later`);
};

const addYield = (id: string, traineeId?: string): void => {
  const entry = pokemonById(id);
  const trainee = traineeId ? traineeById(traineeId) : selectedTrainee();
  if (!entry || !trainee) {
    status("Select a trainee before adding a battle yield");
    return;
  }
  if (traineeId) state.selectedTraineeId = trainee.id;
  let remaining =
    state.generation <= 2
      ? Infinity
      : Math.max(
          0,
          510 -
            statsForGeneration(state.generation).reduce(
              (sum, stat) => sum + trainee.evs[stat],
              0,
            ),
        );
  let gained = 0;
  for (const stat of statsForGeneration(state.generation)) {
    const gain = Math.min(
      entry.evs[stat],
      statCap(state.generation) - trainee.evs[stat],
      remaining,
    );
    trainee.evs[stat] += gain;
    gained += gain;
    remaining -= gain;
  }
  updateAndRender();
  status(
    gained > 0
      ? `${entry.name}'s yield added to ${trainee.name || "unnamed trainee"}`
      : `${trainee.name || "Trainee"} has reached the applicable training cap`,
  );
};

const newTrainee = (): Trainee => ({
  id: crypto.randomUUID(),
  name: "",
  evs: emptyEvs(),
});

const showDetails = (id: string): void => {
  const entry = pokemonById(id);
  if (!entry) return;
  byId("details-content").innerHTML = renderDetails(entry, state.generation);
  byId<HTMLDialogElement>("details-dialog").showModal();
};

const handleAction = (button: HTMLElement): void => {
  const action = button.dataset.action;
  const id = button.dataset.id;
  const card = button.closest<HTMLElement>("[data-trainee-id]");
  const trainee = card?.dataset.traineeId
    ? traineeById(card.dataset.traineeId)
    : undefined;
  if (action === "reference" && id) addReference(id);
  if (action === "yield" && id) addYield(id);
  if (action === "details" && id) showDetails(id);
  if (action === "remove-reference" && id) {
    state.quickReference = state.quickReference.filter((entry) => entry !== id);
    updateAndRender();
  }
  if (action === "clear-reference") {
    state.quickReference = [];
    updateAndRender();
  }
  if (action === "add-trainee") {
    if (state.trainees.length >= MAX_TRAINEES) {
      status(`The tracker is limited to ${MAX_TRAINEES} trainees`);
      return;
    }
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
    state.trainees = state.trainees.filter(
      ({ id: traineeId }) => traineeId !== trainee.id,
    );
    if (state.selectedTraineeId === trainee.id)
      state.selectedTraineeId = state.trainees[0]?.id ?? null;
    updateAndRender();
  }
  if (
    action === "reset-trainee" &&
    trainee &&
    window.confirm(
      `Reset all ${state.generation <= 2 ? "stat experience" : "EV"} totals for ${trainee.name || "this trainee"}?`,
    )
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
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLElement>("[data-action]");
    if (button) {
      handleAction(button);
      return;
    }
    const card = event.target.closest<HTMLElement>("[data-trainee-id]");
    if (
      card?.dataset.traineeId &&
      state.selectedTraineeId !== card.dataset.traineeId
    ) {
      state.selectedTraineeId = card.dataset.traineeId;
      updateSelectionUi();
      status(
        `${traineeById(card.dataset.traineeId)?.name || "Trainee"} selected`,
      );
      persistSoon();
    }
  });
  document.addEventListener("dragstart", (event) => {
    if (!(event.target instanceof Element)) return;
    const card = event.target.closest<HTMLElement>("[data-id][draggable=true]");
    if (card?.dataset.id && event.dataTransfer)
      event.dataTransfer.setData("text/plain", card.dataset.id);
  });
  for (const id of ["quickchart", "evtracker"] as const) {
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
      const pokemonId = event.dataTransfer?.getData("text/plain") ?? "";
      if (id === "quickchart") {
        addReference(pokemonId);
      } else {
        const card =
          event.target instanceof Element
            ? event.target.closest<HTMLElement>("[data-trainee-id]")
            : null;
        addYield(pokemonId, card?.dataset.traineeId);
      }
    });
  }
};

const renderGenerationControls = (): void => {
  const stats = statsForGeneration(state.generation);
  byId("filter-grid").innerHTML =
    stats
      .map(
        (stat) =>
          `<label><span>${statLabels[stat]}</span><input data-filter="${stat}" type="text" maxlength="8" value="${state.filters[stat]}" /></label>`,
      )
      .join("") +
    '<button id="clear-filters" type="button" class="quiet-button clear-filters">Clear yield filters</button>';
  byId("result-sort").innerHTML =
    '<option value="dex">Pokédex #</option><option value="name">Name</option>' +
    stats
      .map((stat) => `<option value="${stat}">${statLabels[stat]}</option>`)
      .join("");
  setInput("result-sort", state.sortKey);
  const notes: Record<Generation, string> = {
    1: "Red/Blue/Yellow: defeated Pokémon award their base stats as stat experience. One Special stat; 65,535 per stat. Species data, not game availability.",
    2: "Gold/Silver/Crystal: base stats award stat experience. Special uses the defeated Pokémon’s Special Attack. 65,535 per stat.",
    3: "Ruby/Sapphire/Emerald and FireRed/LeafGreen: 510 total EVs, 255 per stat.",
    4: "Diamond/Pearl/Platinum and HeartGold/SoulSilver: 510 total EVs, 255 per stat.",
    5: "Black 2/White 2 yield table; some Black/White yields differ. 510 total EVs, 255 per stat.",
    6: "X/Y and Omega Ruby/Alpha Sapphire: 510 total EVs, 252 per stat.",
    7: "Sun/Moon and Ultra Sun/Ultra Moon. Let’s Go uses a different training system. 510 total EVs, 252 per stat.",
    8: "Sword/Shield and Brilliant Diamond/Shining Pearl use EVs; Legends: Arceus uses effort levels. Species and forms are not filtered by game availability.",
    9: "Scarlet/Violet: 510 total EVs, 252 per stat. Species and forms are not filtered by game availability.",
  };
  byId("generation-note").textContent =
    notes[state.generation] +
    " Battle bonuses, items, and Pokérus are not included.";
};

const bindControls = (): void => {
  byId<HTMLInputElement>("search").addEventListener("input", (event) => {
    state.query = (event.currentTarget as HTMLInputElement).value.slice(0, 80);
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
    byId("ev-options").classList.toggle("filter-expanded", state.filterEnabled);
    updateFilterDisclosure();
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
  byId("filter-grid").addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.filter) return;
    const key = input.dataset.filter as keyof YieldFilters;
    state.filters[key] = input.value.slice(0, 8);
    input.setAttribute(
      "aria-invalid",
      /^(?:\*|\d+[+-]?)?$/.test(input.value.trim()) ? "false" : "true",
    );
    updateFilterDisclosure();
    updateAndRender();
  });
  byId("filter-grid").addEventListener("click", (event) => {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest("#clear-filters")
    )
      return;
    for (const key of statsForGeneration(state.generation))
      state.filters[key] = "";
    syncControls();
    updateAndRender();
  });
  byId<HTMLSelectElement>("generation").addEventListener(
    "change",
    async (event) => {
      const generation = Number(
        (event.currentTarget as HTMLSelectElement).value,
      ) as Generation;
      const oldState = state;
      try {
        try {
          saveState(oldState);
        } catch {
          status("Local saving is unavailable");
        }
        const next = await loadPokemon(generation);
        pokemon = next;
        state = loadGenerationState(generation);
        const known = new Set(pokemon.map((entry) => entry.id));
        state.quickReference = state.quickReference.filter((id) =>
          known.has(id),
        );
        history.replaceState(null, "", window.location.href.split("#")[0]);
        syncControls();
        updateAndRender();
        status(`Generation ${generation} loaded`);
      } catch (error) {
        console.error(error);
        setInput("generation", String(oldState.generation));
        status(`Could not load Generation ${generation}`);
      }
    },
  );
  byId("toggle-filter-fields").addEventListener("click", () => {
    const options = byId("ev-options");
    options.classList.toggle("filter-expanded");
    updateFilterDisclosure();
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
    try {
      clearStoredState();
    } catch {
      status("Saved data could not be cleared in this browser");
      return;
    }
    history.replaceState(null, "", window.location.href.split("#")[0]);
    state = defaultState(state.generation);
    syncControls();
    updateAndRender();
    status("Saved data cleared");
  });
  byId("evtracker").addEventListener("focusin", (event) => {
    if (!(event.target instanceof Element)) return;
    const card = event.target.closest<HTMLElement>("[data-trainee-id]");
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
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const id =
      input.closest<HTMLElement>("[data-trainee-id]")?.dataset.traineeId;
    const trainee = id ? traineeById(id) : undefined;
    if (!trainee) return;
    if (input.dataset.field === "name")
      trainee.name = input.value.replaceAll(/[\\/]/g, "").slice(0, 40);
    else if (
      input.dataset.field &&
      statsForGeneration(state.generation).includes(
        input.dataset.field as (typeof statKeys)[number],
      )
    )
      trainee.evs[input.dataset.field as (typeof statKeys)[number]] = Math.max(
        0,
        Math.min(
          statCap(state.generation),
          Number.parseInt(input.value, 10) || 0,
        ),
      );
    persistSoon();
    const total = statsForGeneration(state.generation).reduce(
      (sum, stat) => sum + trainee.evs[stat],
      0,
    );
    const totalElement = input
      .closest(".tracker-entry")
      ?.querySelector(".tracker-total");
    if (totalElement) {
      totalElement.textContent =
        state.generation <= 2 ? `Up to 65,535 per stat` : `${total} / 510 EVs`;
      totalElement.classList.toggle(
        "over-limit",
        state.generation > 2 && total > 510,
      );
    }
    if (state.selectedTraineeId === trainee.id)
      byId("selected-trainee-summary").textContent =
        `Adding to: ${trainee.name || "Unnamed trainee"}`;
  });
  byId("evtracker").addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.dataset.field === "name")
      return;
    const id =
      input.closest<HTMLElement>("[data-trainee-id]")?.dataset.traineeId;
    const trainee = id ? traineeById(id) : undefined;
    const stat = input.dataset.field;
    if (
      trainee &&
      stat &&
      statsForGeneration(state.generation).includes(
        stat as (typeof statKeys)[number],
      )
    ) {
      input.value = String(trainee.evs[stat as (typeof statKeys)[number]]);
    }
  });
  const dialog = byId<HTMLDialogElement>("details-dialog");
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
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
    const loaded = loadState();
    state = loaded.state;
    pokemon = await loadPokemon(state.generation);
    const knownIds = new Set(pokemon.map(({ id }) => id));
    state.quickReference = state.quickReference.filter((id) =>
      knownIds.has(id),
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
