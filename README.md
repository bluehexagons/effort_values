# effort_values

An effort value yield search and tracker for Pokémon. The app is a static site, so it can be hosted directly on GitHub Pages.

## Features

* All of the Pokemon at the time (up to Arceus)
* Namable party Pokemon and favorites tracking
* One-click EV adding
* Responsive layout for desktop and mobile browsers
* Local autosave in browser storage
* Shareable state links using a versioned URL hash
* Drag-and-drop on desktop, with tap-friendly add controls on touch devices
* Sprites taken from somewhere, possibly Bulbapedia
* Still-working Bulbapedia links

## Saving and sharing

Your current search, filters, quick reference, and EV tracker are saved locally in the browser. Use **Share / Copy link** to create a link containing the current state; opening that link loads the shared state and also saves it on the new device.

The current saved-state format is intentionally versioned and is not compatible with the original query-string links.

## License

All Pokemon-related things are owned by their respective Pokemon-related intellectual property owners,
such as The Pokémon Company.

This codebase is licensed under the Apache license. For historic reasons, I left in the original
Creative Commons GPL 2.0 license banner, which can be used too.
