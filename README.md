# Figma Master Hub

A command palette plugin for Figma that puts all your most-used actions in one searchable interface. No more switching between plugins or digging through menus.

## How It Works

Open the plugin and start typing. The search bar fuzzy-matches against all available commands. Hit enter to run the highlighted command. The plugin stays open so you can chain multiple actions without reopening.

## Features

- **Command Palette** — Spotlight-style search across 55+ built-in commands. Type to filter, arrow keys to navigate, enter to run.

- **Favorites** — Star any command to pin it to the top of your palette. Click the star icon next to any result, or toggle favorites from the Manage view.

- **Recents** — Your last 8 commands automatically appear at the top so your most-used actions are always one keystroke away.

- **Manage Commands** — Toggle individual commands on or off from the Manage panel. Use Enable All / Disable All for bulk changes. Filter by name or keyword. Only enabled commands appear in the palette.

- **Macros** — Chain multiple commands into a single action. Open the Macro Builder, give it a name, add commands in order, save. Run your macro from the palette or the Macros panel. Edit or delete macros at any time.

- **Parameterized Commands** — Some commands prompt for input before running. Set a custom hex fill color, resize layers to exact pixel dimensions, or choose shape dimensions on creation.

- **Viewport Placement** — All created shapes and frames appear where you're looking on the canvas, not at the origin.

- **Persistent Settings** — All your preferences (enabled commands, favorites, recents, macros) are saved locally and persist across sessions.

## Built-in Commands

| Category | Commands |
|---|---|
| **Shapes** | Rectangle, Circle, Line, Polygon, Star (all with size prompts). Pre-sized Mobile (375x812), Desktop (1440x900), and Tablet (768x1024) frames. |
| **Text** | Create text nodes. Uppercase, lowercase, or title case. Set font size to 12, 16, 24, 32, or 48. |
| **Layers** | Rename sequentially, sort A-Z / Z-A, flatten, group, ungroup, lock, unlock, hide, show all. |
| **Styles** | Remove fills / strokes / effects. Set fill to black, white, red, blue, green, or custom hex. Opacity 25-100%. Drop shadow, blur. Corner radius 0 / 8 / 16 / 999 (pill). |
| **Layout** | Distribute horizontally / vertically. Auto layout horizontal / vertical. Gap 0 / 8 / 16 / 24. Resize to exact dimensions. |
| **Components** | Create component from selection. Detach instances. |
| **Selection** | Select / deselect all. Select all text, frames, images, or component instances. |
| **Navigation** | Zoom to selection / fit page. Next / previous page. |
| **Cleanup** | Remove hidden layers. Remove empty groups. |
| **Utilities** | Duplicate / delete selection. |

## Installation

### From source

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. In Figma Desktop, go to **Plugins > Development > Import plugin from manifest...**
5. Select the `manifest.json` file from this project

### Development

```
npm run watch
```

This rebuilds automatically when you edit source files. Reload the plugin in Figma to see changes.

## Adding Custom Commands

Open `src/catalog.ts` and add an object to the array:

```ts
{
  id: "my-command",
  name: "Do Something Cool",
  section: "My Section",
  keywords: "search terms here",
  handler: () => {
    // Your Figma API code
    figma.notify("Done!");
  },
},
```

For commands that need user input:

```ts
{
  id: "my-prompt-command",
  name: "Set Custom Value",
  section: "My Section",
  keywords: "custom input",
  params: [
    { key: "value", label: "Enter a value", type: "text" },
  ],
  handler: (msg) => {
    const val = msg.value;
    // Use the value
  },
},
```

Run `npm run build` and reload the plugin.

## Tech Stack

- TypeScript
- React 18
- [kbar](https://github.com/timc1/kbar) — command palette UI
- Webpack — bundles everything into a single HTML file for Figma's iframe
- Figma Plugin API

## License

MIT
