import { loadPokemon } from "./data.ts";
import { byId } from "./dom.ts";
import { renderApp, updateSortDirection } from "./view.ts";
import { loadGenerationState, loadState, saveState } from "./storage.ts";
import {
  type AppState,
  defaultState,
  type Generation,
  type Pokemon,
  type Trainee,
} from "./types.ts";

export class App {
  state: AppState = defaultState();
  pokemon: Pokemon[] = [];
  readonly sessionProfiles = new Map<Generation, AppState>();
  saveTimer: number | undefined;

  async initialize(): Promise<boolean> {
    const loaded = loadState();
    const pokemon = await loadPokemon(loaded.state.generation);
    this.state = loaded.state;
    this.pokemon = pokemon;
    this.sessionProfiles.set(this.state.generation, this.state);
    this.keepKnownReferences();
    return loaded.fromLink;
  }

  async selectGeneration(generation: Generation): Promise<boolean> {
    window.clearTimeout(this.saveTimer);
    this.sessionProfiles.set(this.state.generation, this.state);
    let saved = true;
    try {
      saveState(this.state);
    } catch {
      saved = false;
    }
    const pokemon = await loadPokemon(generation);
    const state =
      this.sessionProfiles.get(generation) ?? loadGenerationState(generation);
    this.state = state;
    this.pokemon = pokemon;
    this.sessionProfiles.set(generation, state);
    this.keepKnownReferences();
    try {
      saveState(state);
    } catch {
      saved = false;
    }
    return saved;
  }

  private keepKnownReferences(): void {
    const known = new Set(this.pokemon.map(({ id }) => id));
    this.state.quickReference = this.state.quickReference.filter((id) =>
      known.has(id),
    );
  }

  pokemonById(id: string): Pokemon | undefined {
    return this.pokemon.find((entry) => entry.id === id);
  }

  traineeById(id: string): Trainee | undefined {
    return this.state.trainees.find((entry) => entry.id === id);
  }

  selectedTrainee(): Trainee | undefined {
    return this.state.selectedTraineeId
      ? this.traineeById(this.state.selectedTraineeId)
      : undefined;
  }

  status(message: string): void {
    byId("save-status").textContent = message;
  }

  persistSoon(): void {
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      try {
        saveState(this.state);
      } catch {
        this.status("Local saving is unavailable");
      }
    }, 200);
  }

  updateAndRender(): void {
    renderApp(this);
    updateSortDirection(this);
    this.persistSoon();
  }
}
