import { byId } from "./dom.ts";
import { renderDetails } from "./render.ts";
import { recordBattleYield } from "./training.ts";
import {
  emptyEvs,
  MAX_QUICK_REFERENCE,
  MAX_TRAINEES,
  statCap,
  statsForGeneration,
  type StatKey,
  type Trainee,
} from "./types.ts";
import { updateSelectionUi } from "./view.ts";
import type { App } from "./app.ts";

const newTrainee = (): Trainee => ({
  id: crypto.randomUUID(),
  name: "",
  evs: emptyEvs(),
});

export const bindWorkspace = (app: App): void => {
  const addReference = (id: string): void => {
    const entry = app.pokemonById(id);
    if (!entry) return;
    if (app.state.quickReference.includes(id)) {
      app.status(`${entry.name} is already saved`);
      return;
    }
    if (app.state.quickReference.length >= MAX_QUICK_REFERENCE) {
      app.status(`The saved list is limited to ${MAX_QUICK_REFERENCE} Pokémon`);
      return;
    }
    app.state.quickReference.push(id);
    app.updateAndRender();
    app.status(`${entry.name} saved for later`);
  };

  const addYield = (id: string, traineeId?: string): void => {
    const entry = app.pokemonById(id);
    const trainee = traineeId
      ? app.traineeById(traineeId)
      : app.selectedTrainee();
    if (!entry || !trainee) {
      app.status("Select a trainee before adding a battle yield");
      return;
    }
    if (traineeId) app.state.selectedTraineeId = trainee.id;
    const gained = recordBattleYield(trainee, entry, app.state.generation);
    app.updateAndRender();
    app.status(
      gained > 0
        ? `${entry.name}'s yield added to ${trainee.name || "unnamed trainee"}`
        : `${trainee.name || "Trainee"} has reached the applicable training cap`,
    );
  };

  const showDetails = (id: string): void => {
    const entry = app.pokemonById(id);
    if (!entry) return;
    byId("details-content").innerHTML = renderDetails(
      entry,
      app.state.generation,
    );
    byId<HTMLDialogElement>("details-dialog").showModal();
  };

  const handleAction = (button: HTMLElement): void => {
    const action = button.dataset.action;
    const id = button.dataset.id;
    const card = button.closest<HTMLElement>("[data-trainee-id]");
    const trainee = card?.dataset.traineeId
      ? app.traineeById(card.dataset.traineeId)
      : undefined;
    if (action === "reference" && id) addReference(id);
    if (action === "yield" && id) addYield(id);
    if (action === "details" && id) showDetails(id);
    if (action === "remove-reference" && id) {
      app.state.quickReference = app.state.quickReference.filter(
        (entry) => entry !== id,
      );
      app.updateAndRender();
    }
    if (action === "clear-reference") {
      app.state.quickReference = [];
      app.updateAndRender();
    }
    if (action === "add-trainee") {
      if (app.state.trainees.length >= MAX_TRAINEES) {
        app.status(`The tracker is limited to ${MAX_TRAINEES} trainees`);
        return;
      }
      const added = newTrainee();
      app.state.trainees.push(added);
      app.state.selectedTraineeId = added.id;
      app.updateAndRender();
      byId("evtracker")
        .querySelector<HTMLInputElement>(
          `[data-trainee-id="${added.id}"] input`,
        )
        ?.focus();
    }
    if (action === "select-trainee" && trainee) {
      app.state.selectedTraineeId = trainee.id;
      app.updateAndRender();
      app.status(`${trainee.name || "Trainee"} selected`);
    }
    if (action === "remove-trainee" && trainee) {
      app.state.trainees = app.state.trainees.filter(
        ({ id: traineeId }) => traineeId !== trainee.id,
      );
      if (app.state.selectedTraineeId === trainee.id)
        app.state.selectedTraineeId = app.state.trainees[0]?.id ?? null;
      app.updateAndRender();
    }
    if (
      action === "reset-trainee" &&
      trainee &&
      window.confirm(
        `Reset all ${app.state.generation <= 2 ? "stat experience" : "EV"} totals for ${trainee.name || "this trainee"}?`,
      )
    ) {
      trainee.evs = emptyEvs();
      app.updateAndRender();
    }
    if (action === "close-details")
      byId<HTMLDialogElement>("details-dialog").close();
  };

  document.addEventListener(
    "error",
    (event) => {
      const image = event.target;
      if (
        !(image instanceof HTMLImageElement) ||
        !image.matches(".sprite-art img")
      )
        return;
      const art = image.parentElement;
      if (art) art.style.display = "none";
      const fallback = art?.nextElementSibling;
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
      app.state.selectedTraineeId !== card.dataset.traineeId
    ) {
      app.state.selectedTraineeId = card.dataset.traineeId;
      updateSelectionUi(app);
      app.status(
        `${app.traineeById(card.dataset.traineeId)?.name || "Trainee"} selected`,
      );
      app.persistSoon();
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
  byId("evtracker").addEventListener("focusin", (event) => {
    if (!(event.target instanceof Element)) return;
    const card = event.target.closest<HTMLElement>("[data-trainee-id]");
    if (
      card?.dataset.traineeId &&
      app.state.selectedTraineeId !== card.dataset.traineeId
    ) {
      app.state.selectedTraineeId = card.dataset.traineeId;
      updateSelectionUi(app);
      app.persistSoon();
    }
  });
  byId("evtracker").addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const id =
      input.closest<HTMLElement>("[data-trainee-id]")?.dataset.traineeId;
    const trainee = id ? app.traineeById(id) : undefined;
    if (!trainee) return;
    if (input.dataset.field === "name")
      trainee.name = input.value.replaceAll(/[\\/]/g, "").slice(0, 40);
    else if (
      input.dataset.field &&
      statsForGeneration(app.state.generation).includes(
        input.dataset.field as StatKey,
      )
    )
      trainee.evs[input.dataset.field as StatKey] = Math.max(
        0,
        Math.min(
          statCap(app.state.generation),
          Number.parseInt(input.value, 10) || 0,
        ),
      );
    app.persistSoon();
    const total = statsForGeneration(app.state.generation).reduce(
      (sum, stat) => sum + trainee.evs[stat],
      0,
    );
    const totalElement = input
      .closest(".tracker-entry")
      ?.querySelector(".tracker-total");
    if (totalElement) {
      totalElement.textContent =
        app.state.generation <= 2
          ? `Up to 65,535 per stat`
          : `${total} / 510 EVs`;
      totalElement.classList.toggle(
        "over-limit",
        app.state.generation > 2 && total > 510,
      );
    }
    if (app.state.selectedTraineeId === trainee.id)
      byId("selected-trainee-summary").textContent =
        `Adding to: ${trainee.name || "Unnamed trainee"}`;
  });
  byId("evtracker").addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.dataset.field === "name")
      return;
    const id =
      input.closest<HTMLElement>("[data-trainee-id]")?.dataset.traineeId;
    const trainee = id ? app.traineeById(id) : undefined;
    const stat = input.dataset.field;
    if (
      trainee &&
      stat &&
      statsForGeneration(app.state.generation).includes(stat as StatKey)
    ) {
      input.value = String(trainee.evs[stat as StatKey]);
    }
  });
};
