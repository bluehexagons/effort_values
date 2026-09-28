// oxlint-disable-next-line import/no-unassigned-import -- Vite bundles this stylesheet for its side effect.
import "./styles.css";
import { App } from "./app.ts";
import { bindControls } from "./controls.ts";
import { byId } from "./dom.ts";
import { renderApp, syncControls } from "./view.ts";
import { bindWorkspace } from "./workspace.ts";

const app = new App();

const start = async (): Promise<void> => {
  bindWorkspace(app);
  bindControls(app);
  try {
    const fromLink = await app.initialize();
    syncControls(app);
    renderApp(app);
    app.status(
      fromLink ? "Shared setup loaded" : "Ready — changes save automatically",
    );
    app.persistSoon();
  } catch (error) {
    console.error(error);
    byId("result-list").innerHTML =
      '<div class="empty-state"><strong>Could not load Pokémon data.</strong><br />Refresh the page to try again.</div>';
    app.status("Data failed to load");
  }
};

void start();
