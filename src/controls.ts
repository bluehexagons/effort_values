import { byId, setInput } from "./dom.ts";
import { clearStoredState, encodeState } from "./storage.ts";
import {
  defaultState,
  statsForGeneration,
  type Generation,
  type SortKey,
  type YieldFilters,
} from "./types.ts";
import { syncControls, updateFilterDisclosure } from "./view.ts";
import type { App } from "./app.ts";

export const bindControls = (app: App): void => {
  byId<HTMLInputElement>("search").addEventListener("input", (event) => {
    app.state.query = (event.currentTarget as HTMLInputElement).value.slice(
      0,
      80,
    );
    app.updateAndRender();
  });
  byId<HTMLInputElement>("within-filter").addEventListener(
    "change",
    (event) => {
      app.state.matchAnywhere = (
        event.currentTarget as HTMLInputElement
      ).checked;
      app.updateAndRender();
    },
  );
  byId<HTMLInputElement>("showall").addEventListener("change", (event) => {
    app.state.showNonMatches = (
      event.currentTarget as HTMLInputElement
    ).checked;
    app.updateAndRender();
  });
  byId<HTMLInputElement>("loadall").addEventListener("change", (event) => {
    app.state.showAllWhenEmpty = (
      event.currentTarget as HTMLInputElement
    ).checked;
    app.updateAndRender();
  });
  byId<HTMLInputElement>("byev").addEventListener("change", (event) => {
    app.state.filterEnabled = (event.currentTarget as HTMLInputElement).checked;
    byId("evform").hidden = !app.state.filterEnabled;
    byId("ev-options").classList.toggle(
      "filter-expanded",
      app.state.filterEnabled,
    );
    updateFilterDisclosure(app);
    app.updateAndRender();
  });
  byId<HTMLSelectElement>("result-sort").addEventListener("change", (event) => {
    app.state.sortKey = (event.currentTarget as HTMLSelectElement)
      .value as SortKey;
    app.state.sortDescending = false;
    app.updateAndRender();
  });
  byId("reverse-sort").addEventListener("click", () => {
    app.state.sortDescending = !app.state.sortDescending;
    app.updateAndRender();
  });
  byId("filter-grid").addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.filter) return;
    const key = input.dataset.filter as keyof YieldFilters;
    app.state.filters[key] = input.value.slice(0, 8);
    input.setAttribute(
      "aria-invalid",
      /^(?:\*|\d+[+-]?)?$/.test(input.value.trim()) ? "false" : "true",
    );
    updateFilterDisclosure(app);
    app.updateAndRender();
  });
  byId("filter-grid").addEventListener("click", (event) => {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest("#clear-filters")
    )
      return;
    for (const key of statsForGeneration(app.state.generation))
      app.state.filters[key] = "";
    syncControls(app);
    app.updateAndRender();
  });
  byId<HTMLSelectElement>("generation").addEventListener(
    "change",
    async (event) => {
      const selector = event.currentTarget as HTMLSelectElement;
      const generation = Number(selector.value) as Generation;
      const oldGeneration = app.state.generation;
      selector.disabled = true;
      byId<HTMLButtonElement>("reset-state").disabled = true;
      try {
        const saved = await app.selectGeneration(generation);
        history.replaceState(null, "", window.location.href.split("#")[0]);
        syncControls(app);
        app.updateAndRender();
        app.status(
          `Generation ${generation} loaded${saved ? "" : "; local saving is unavailable"}`,
        );
      } catch (error) {
        console.error(error);
        setInput("generation", String(oldGeneration));
        app.status(`Could not load Generation ${generation}`);
      } finally {
        selector.disabled = false;
        byId<HTMLButtonElement>("reset-state").disabled = false;
      }
    },
  );
  byId("toggle-filter-fields").addEventListener("click", () => {
    const options = byId("ev-options");
    options.classList.toggle("filter-expanded");
    updateFilterDisclosure(app);
  });
  byId("share-state").addEventListener("click", async () => {
    const url = `${window.location.href.split("#")[0]}#state=${encodeState(app.state)}`;
    history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      app.status("Share link copied");
    } catch {
      app.status("Share link ready in the address bar");
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
      app.status("Saved data could not be cleared in this browser");
      return;
    }
    history.replaceState(null, "", window.location.href.split("#")[0]);
    app.sessionProfiles.clear();
    app.state = defaultState(app.state.generation);
    app.sessionProfiles.set(app.state.generation, app.state);
    syncControls(app);
    app.updateAndRender();
    app.status("Saved data cleared");
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
