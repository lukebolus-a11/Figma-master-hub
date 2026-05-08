// =====================================================================
// COMMAND CATALOG — the single source of truth.
//
// To add a new command:  just add an object to this array.
// That's it. It will appear in the Manage panel and can be toggled on.
//
//   { id, name, section, keywords, handler }
//
// For commands that need user input, add a params array:
//   params: [{ key: "hex", label: "Hex color", type: "text" }]
//
// =====================================================================

export interface ParamDef {
  key: string;
  label: string;
  type: "text" | "number";
}

export interface CatalogEntry {
  id: string;
  name: string;
  section: string;
  keywords: string;
  params?: ParamDef[];
  handler: (msg?: any) => void | Promise<void>;
}

export interface CatalogMeta {
  id: string;
  name: string;
  section: string;
  keywords: string;
  params?: ParamDef[];
}

export function getCatalogMeta(catalog: CatalogEntry[]): CatalogMeta[] {
  return catalog.map(({ id, name, section, keywords, params }) => ({
    id,
    name,
    section,
    keywords,
    ...(params ? { params } : {}),
  }));
}

// Helper: position a node at the center of the current viewport
function placeAtViewport(node: SceneNode, w: number, h: number) {
  const center = figma.viewport.center;
  node.x = center.x - w / 2;
  node.y = center.y - h / 2;
}

// Helper: parse hex string to Figma RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

// ── The Catalog ─────────────────────────────────────────────────────

const catalog: CatalogEntry[] = [
  // ═══════════════════════════════════════════════════════════════════
  //  SHAPES
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "create-rect",
    name: "Create Rectangle",
    section: "Shapes",
    keywords: "square shape box",
    params: [
      { key: "width", label: "Width (default 150)", type: "number" },
      { key: "height", label: "Height (default 150)", type: "number" },
    ],
    handler: (msg: any) => {
      const w = parseFloat(msg?.width) || 150;
      const h = parseFloat(msg?.height) || 150;
      const node = figma.createRectangle();
      node.resize(w, h);
      node.fills = [{ type: "SOLID", color: { r: 0.05, g: 0.6, b: 1 } }];
      figma.currentPage.appendChild(node);
      placeAtViewport(node, w, h);
      figma.currentPage.selection = [node];
      figma.notify(`Rectangle created (${w}x${h})`);
    },
  },
  {
    id: "create-circle",
    name: "Create Circle",
    section: "Shapes",
    keywords: "round ellipse oval",
    params: [
      { key: "width", label: "Width (default 150)", type: "number" },
      { key: "height", label: "Height (default 150)", type: "number" },
    ],
    handler: (msg: any) => {
      const w = parseFloat(msg?.width) || 150;
      const h = parseFloat(msg?.height) || 150;
      const node = figma.createEllipse();
      node.resize(w, h);
      node.fills = [{ type: "SOLID", color: { r: 1, g: 0.4, b: 0.4 } }];
      figma.currentPage.appendChild(node);
      placeAtViewport(node, w, h);
      figma.currentPage.selection = [node];
      figma.notify(`Circle created (${w}x${h})`);
    },
  },
  {
    id: "create-line",
    name: "Create Line",
    section: "Shapes",
    keywords: "stroke rule divider",
    params: [
      { key: "width", label: "Length (default 300)", type: "number" },
    ],
    handler: (msg: any) => {
      const w = parseFloat(msg?.width) || 300;
      const node = figma.createLine();
      node.resize(w, 0);
      node.strokes = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
      figma.currentPage.appendChild(node);
      placeAtViewport(node, w, 0);
      figma.currentPage.selection = [node];
      figma.notify(`Line created (${w}px)`);
    },
  },
  {
    id: "create-polygon",
    name: "Create Polygon",
    section: "Shapes",
    keywords: "triangle hex pentagon",
    params: [
      { key: "width", label: "Width (default 150)", type: "number" },
      { key: "height", label: "Height (default 150)", type: "number" },
    ],
    handler: (msg: any) => {
      const w = parseFloat(msg?.width) || 150;
      const h = parseFloat(msg?.height) || 150;
      const node = figma.createPolygon();
      node.resize(w, h);
      node.fills = [{ type: "SOLID", color: { r: 0.3, g: 0.8, b: 0.5 } }];
      figma.currentPage.appendChild(node);
      placeAtViewport(node, w, h);
      figma.currentPage.selection = [node];
      figma.notify(`Polygon created (${w}x${h})`);
    },
  },
  {
    id: "create-star",
    name: "Create Star",
    section: "Shapes",
    keywords: "badge sparkle",
    params: [
      { key: "width", label: "Width (default 150)", type: "number" },
      { key: "height", label: "Height (default 150)", type: "number" },
    ],
    handler: (msg: any) => {
      const w = parseFloat(msg?.width) || 150;
      const h = parseFloat(msg?.height) || 150;
      const node = figma.createStar();
      node.resize(w, h);
      node.fills = [{ type: "SOLID", color: { r: 1, g: 0.8, b: 0 } }];
      figma.currentPage.appendChild(node);
      placeAtViewport(node, w, h);
      figma.currentPage.selection = [node];
      figma.notify(`Star created (${w}x${h})`);
    },
  },
  {
    id: "create-frame-mobile",
    name: "Create Mobile Frame (375x812)",
    section: "Shapes",
    keywords: "artboard screen phone iphone",
    handler: () => {
      const f = figma.createFrame();
      f.resize(375, 812);
      f.name = "Mobile";
      figma.currentPage.appendChild(f);
      placeAtViewport(f, 375, 812);
      figma.currentPage.selection = [f];
      figma.notify("Mobile frame created");
    },
  },
  {
    id: "create-frame-desktop",
    name: "Create Desktop Frame (1440x900)",
    section: "Shapes",
    keywords: "artboard screen monitor web",
    handler: () => {
      const f = figma.createFrame();
      f.resize(1440, 900);
      f.name = "Desktop";
      figma.currentPage.appendChild(f);
      placeAtViewport(f, 1440, 900);
      figma.currentPage.selection = [f];
      figma.notify("Desktop frame created");
    },
  },
  {
    id: "create-frame-tablet",
    name: "Create Tablet Frame (768x1024)",
    section: "Shapes",
    keywords: "artboard screen ipad",
    handler: () => {
      const f = figma.createFrame();
      f.resize(768, 1024);
      f.name = "Tablet";
      figma.currentPage.appendChild(f);
      placeAtViewport(f, 768, 1024);
      figma.currentPage.selection = [f];
      figma.notify("Tablet frame created");
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  //  TEXT
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "create-text",
    name: "Create Text Node",
    section: "Text",
    keywords: "type label string",
    handler: async () => {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      const t = figma.createText();
      t.characters = "Hello, World!";
      t.fontSize = 24;
      figma.currentPage.appendChild(t);
      placeAtViewport(t, t.width, t.height);
      figma.currentPage.selection = [t];
      figma.notify("Text created");
    },
  },
  {
    id: "text-uppercase",
    name: "Uppercase Text",
    section: "Text",
    keywords: "caps upper transform",
    handler: async () => {
      for (const n of figma.currentPage.selection) {
        if (n.type === "TEXT") {
          await figma.loadFontAsync(n.fontName as FontName);
          n.characters = n.characters.toUpperCase();
        }
      }
      figma.notify("Text uppercased");
    },
  },
  {
    id: "text-lowercase",
    name: "Lowercase Text",
    section: "Text",
    keywords: "lower transform",
    handler: async () => {
      for (const n of figma.currentPage.selection) {
        if (n.type === "TEXT") {
          await figma.loadFontAsync(n.fontName as FontName);
          n.characters = n.characters.toLowerCase();
        }
      }
      figma.notify("Text lowercased");
    },
  },
  {
    id: "text-titlecase",
    name: "Title Case Text",
    section: "Text",
    keywords: "capitalize transform",
    handler: async () => {
      for (const n of figma.currentPage.selection) {
        if (n.type === "TEXT") {
          await figma.loadFontAsync(n.fontName as FontName);
          n.characters = n.characters.replace(
            /\w\S*/g,
            (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()
          );
        }
      }
      figma.notify("Text title-cased");
    },
  },
  {
    id: "text-size-12",
    name: "Set Font Size 12",
    section: "Text",
    keywords: "small body",
    handler: async () => {
      for (const n of figma.currentPage.selection) {
        if (n.type === "TEXT") { await figma.loadFontAsync(n.fontName as FontName); n.fontSize = 12; }
      }
      figma.notify("Font size set to 12");
    },
  },
  {
    id: "text-size-16",
    name: "Set Font Size 16",
    section: "Text",
    keywords: "body base",
    handler: async () => {
      for (const n of figma.currentPage.selection) {
        if (n.type === "TEXT") { await figma.loadFontAsync(n.fontName as FontName); n.fontSize = 16; }
      }
      figma.notify("Font size set to 16");
    },
  },
  {
    id: "text-size-24",
    name: "Set Font Size 24",
    section: "Text",
    keywords: "heading title",
    handler: async () => {
      for (const n of figma.currentPage.selection) {
        if (n.type === "TEXT") { await figma.loadFontAsync(n.fontName as FontName); n.fontSize = 24; }
      }
      figma.notify("Font size set to 24");
    },
  },
  {
    id: "text-size-32",
    name: "Set Font Size 32",
    section: "Text",
    keywords: "heading large",
    handler: async () => {
      for (const n of figma.currentPage.selection) {
        if (n.type === "TEXT") { await figma.loadFontAsync(n.fontName as FontName); n.fontSize = 32; }
      }
      figma.notify("Font size set to 32");
    },
  },
  {
    id: "text-size-48",
    name: "Set Font Size 48",
    section: "Text",
    keywords: "display hero xl",
    handler: async () => {
      for (const n of figma.currentPage.selection) {
        if (n.type === "TEXT") { await figma.loadFontAsync(n.fontName as FontName); n.fontSize = 48; }
      }
      figma.notify("Font size set to 48");
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  //  LAYERS
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "rename-layers",
    name: "Rename Layers (sequential)",
    section: "Layers",
    keywords: "name label number",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (!sel.length) { figma.notify("No layers selected"); return; }
      sel.forEach((n, i) => (n.name = `Layer ${i + 1}`));
      figma.notify(`Renamed ${sel.length} layer(s)`);
    },
  },
  {
    id: "sort-layers-az",
    name: "Sort Layers A-Z",
    section: "Layers",
    keywords: "order alphabetical arrange",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (sel.length < 2) { figma.notify("Select 2+ layers"); return; }
      const p = sel[0].parent;
      if (!p || !("children" in p)) return;
      const sorted = [...sel].sort((a, b) => a.name.localeCompare(b.name));
      const idx = Math.min(...sel.map((n) => (p as ChildrenMixin).children.indexOf(n)));
      sorted.forEach((n, i) => (p as ChildrenMixin).insertChild(idx + i, n));
      figma.notify("Sorted A-Z");
    },
  },
  {
    id: "sort-layers-za",
    name: "Sort Layers Z-A",
    section: "Layers",
    keywords: "order reverse alphabetical",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (sel.length < 2) { figma.notify("Select 2+ layers"); return; }
      const p = sel[0].parent;
      if (!p || !("children" in p)) return;
      const sorted = [...sel].sort((a, b) => b.name.localeCompare(a.name));
      const idx = Math.min(...sel.map((n) => (p as ChildrenMixin).children.indexOf(n)));
      sorted.forEach((n, i) => (p as ChildrenMixin).insertChild(idx + i, n));
      figma.notify("Sorted Z-A");
    },
  },
  {
    id: "flatten-selection",
    name: "Flatten Selection",
    section: "Layers",
    keywords: "merge rasterize combine",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (!sel.length) { figma.notify("No layers selected"); return; }
      const flat = figma.flatten(sel);
      figma.currentPage.selection = [flat];
      figma.notify("Flattened");
    },
  },
  {
    id: "group-selection",
    name: "Group Selection",
    section: "Layers",
    keywords: "combine wrap",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (sel.length < 2) { figma.notify("Select 2+ layers"); return; }
      const g = figma.group(sel, figma.currentPage);
      g.name = "Group";
      figma.currentPage.selection = [g];
      figma.notify("Grouped");
    },
  },
  {
    id: "ungroup-selection",
    name: "Ungroup Selection",
    section: "Layers",
    keywords: "unwrap explode",
    handler: () => {
      const sel = figma.currentPage.selection;
      let count = 0;
      for (const n of sel) {
        if (n.type === "GROUP") {
          const parent = n.parent!;
          const kids = [...n.children];
          const idx = (parent as ChildrenMixin).children.indexOf(n);
          kids.forEach((child, i) => (parent as ChildrenMixin).insertChild(idx + i, child));
          n.remove();
          count++;
        }
      }
      figma.notify(count ? `Ungrouped ${count} group(s)` : "No groups selected");
    },
  },
  {
    id: "lock-selection",
    name: "Lock Selection",
    section: "Layers",
    keywords: "freeze protect",
    handler: () => {
      const sel = figma.currentPage.selection;
      sel.forEach((n) => (n.locked = true));
      figma.notify(`Locked ${sel.length} layer(s)`);
    },
  },
  {
    id: "unlock-selection",
    name: "Unlock Selection",
    section: "Layers",
    keywords: "unfreeze unprotect",
    handler: () => {
      const sel = figma.currentPage.selection;
      sel.forEach((n) => (n.locked = false));
      figma.notify(`Unlocked ${sel.length} layer(s)`);
    },
  },
  {
    id: "hide-selection",
    name: "Hide Selection",
    section: "Layers",
    keywords: "invisible toggle visibility",
    handler: () => {
      const sel = figma.currentPage.selection;
      sel.forEach((n) => (n.visible = false));
      figma.notify(`Hidden ${sel.length} layer(s)`);
    },
  },
  {
    id: "show-all-layers",
    name: "Show All Hidden Layers",
    section: "Layers",
    keywords: "unhide reveal visibility",
    handler: () => {
      let count = 0;
      figma.currentPage.findAll((n) => {
        if (!n.visible) { n.visible = true; count++; }
        return false;
      });
      figma.notify(count ? `Revealed ${count} layer(s)` : "No hidden layers");
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  //  STYLES
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "remove-fills",
    name: "Remove All Fills",
    section: "Styles",
    keywords: "clear color background",
    handler: () => {
      let c = 0;
      for (const n of figma.currentPage.selection) {
        if ("fills" in n) { (n as GeometryMixin).fills = []; c++; }
      }
      figma.notify(`Removed fills from ${c} layer(s)`);
    },
  },
  {
    id: "remove-strokes",
    name: "Remove All Strokes",
    section: "Styles",
    keywords: "clear border outline",
    handler: () => {
      let c = 0;
      for (const n of figma.currentPage.selection) {
        if ("strokes" in n) { (n as GeometryMixin).strokes = []; c++; }
      }
      figma.notify(`Removed strokes from ${c} layer(s)`);
    },
  },
  {
    id: "remove-effects",
    name: "Remove All Effects",
    section: "Styles",
    keywords: "clear shadow blur",
    handler: () => {
      let c = 0;
      for (const n of figma.currentPage.selection) {
        if ("effects" in n) { (n as BlendMixin).effects = []; c++; }
      }
      figma.notify(`Removed effects from ${c} layer(s)`);
    },
  },
  {
    id: "fill-custom-hex",
    name: "Set Custom Fill Color (Hex)",
    section: "Styles",
    keywords: "color hex custom picker",
    params: [{ key: "hex", label: "Hex color (e.g. #FF5500)", type: "text" }],
    handler: (msg: any) => {
      const rgb = hexToRgb(msg?.hex || "");
      if (!rgb) { figma.notify("Invalid hex color"); return; }
      let c = 0;
      for (const n of figma.currentPage.selection) {
        if ("fills" in n) { (n as GeometryMixin).fills = [{ type: "SOLID", color: rgb }]; c++; }
      }
      figma.notify(c ? `Fill set to #${(msg.hex || "").replace("#", "")}` : "No layers selected");
    },
  },
  {
    id: "fill-black",
    name: "Set Fill Black",
    section: "Styles",
    keywords: "color dark",
    handler: () => {
      for (const n of figma.currentPage.selection) {
        if ("fills" in n) (n as GeometryMixin).fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
      }
      figma.notify("Fill set to black");
    },
  },
  {
    id: "fill-white",
    name: "Set Fill White",
    section: "Styles",
    keywords: "color light",
    handler: () => {
      for (const n of figma.currentPage.selection) {
        if ("fills" in n) (n as GeometryMixin).fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      }
      figma.notify("Fill set to white");
    },
  },
  {
    id: "fill-red",
    name: "Set Fill Red",
    section: "Styles",
    keywords: "color error danger",
    handler: () => {
      for (const n of figma.currentPage.selection) {
        if ("fills" in n) (n as GeometryMixin).fills = [{ type: "SOLID", color: { r: 0.92, g: 0.26, b: 0.26 } }];
      }
      figma.notify("Fill set to red");
    },
  },
  {
    id: "fill-blue",
    name: "Set Fill Blue",
    section: "Styles",
    keywords: "color primary brand",
    handler: () => {
      for (const n of figma.currentPage.selection) {
        if ("fills" in n) (n as GeometryMixin).fills = [{ type: "SOLID", color: { r: 0.05, g: 0.6, b: 1 } }];
      }
      figma.notify("Fill set to blue");
    },
  },
  {
    id: "fill-green",
    name: "Set Fill Green",
    section: "Styles",
    keywords: "color success",
    handler: () => {
      for (const n of figma.currentPage.selection) {
        if ("fills" in n) (n as GeometryMixin).fills = [{ type: "SOLID", color: { r: 0.2, g: 0.78, b: 0.35 } }];
      }
      figma.notify("Fill set to green");
    },
  },
  {
    id: "set-opacity-25",
    name: "Set Opacity 25%",
    section: "Styles",
    keywords: "transparent alpha",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("opacity" in n) (n as BlendMixin).opacity = 0.25;
      figma.notify("Opacity set to 25%");
    },
  },
  {
    id: "set-opacity-50",
    name: "Set Opacity 50%",
    section: "Styles",
    keywords: "transparent alpha half",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("opacity" in n) (n as BlendMixin).opacity = 0.5;
      figma.notify("Opacity set to 50%");
    },
  },
  {
    id: "set-opacity-75",
    name: "Set Opacity 75%",
    section: "Styles",
    keywords: "transparent alpha",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("opacity" in n) (n as BlendMixin).opacity = 0.75;
      figma.notify("Opacity set to 75%");
    },
  },
  {
    id: "reset-opacity",
    name: "Reset Opacity 100%",
    section: "Styles",
    keywords: "opaque full visible",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("opacity" in n) (n as BlendMixin).opacity = 1;
      figma.notify("Opacity reset to 100%");
    },
  },
  {
    id: "add-drop-shadow",
    name: "Add Drop Shadow",
    section: "Styles",
    keywords: "effect elevation",
    handler: () => {
      for (const n of figma.currentPage.selection) {
        if ("effects" in n) {
          (n as BlendMixin).effects = [
            ...(n as BlendMixin).effects,
            {
              type: "DROP_SHADOW",
              color: { r: 0, g: 0, b: 0, a: 0.25 },
              offset: { x: 0, y: 4 },
              radius: 8,
              spread: 0,
              visible: true,
              blendMode: "NORMAL",
            },
          ];
        }
      }
      figma.notify("Drop shadow added");
    },
  },
  {
    id: "add-blur",
    name: "Add Layer Blur",
    section: "Styles",
    keywords: "effect gaussian",
    handler: () => {
      for (const n of figma.currentPage.selection) {
        if ("effects" in n) {
          (n as BlendMixin).effects = [
            ...(n as BlendMixin).effects,
            { type: "LAYER_BLUR", radius: 10, visible: true, blurType: "NORMAL" } as Effect,
          ];
        }
      }
      figma.notify("Blur added");
    },
  },
  {
    id: "round-corners-8",
    name: "Round Corners (8px)",
    section: "Styles",
    keywords: "radius border",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("cornerRadius" in n) (n as RectangleNode).cornerRadius = 8;
      figma.notify("Corners rounded to 8px");
    },
  },
  {
    id: "round-corners-16",
    name: "Round Corners (16px)",
    section: "Styles",
    keywords: "radius border",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("cornerRadius" in n) (n as RectangleNode).cornerRadius = 16;
      figma.notify("Corners rounded to 16px");
    },
  },
  {
    id: "round-corners-full",
    name: "Round Corners (999 / pill)",
    section: "Styles",
    keywords: "radius border pill capsule",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("cornerRadius" in n) (n as RectangleNode).cornerRadius = 999;
      figma.notify("Corners set to pill shape");
    },
  },
  {
    id: "reset-corners",
    name: "Reset Corners (0px)",
    section: "Styles",
    keywords: "radius border sharp square",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("cornerRadius" in n) (n as RectangleNode).cornerRadius = 0;
      figma.notify("Corners reset to 0");
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  //  LAYOUT
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "resize-exact",
    name: "Resize to Exact Dimensions",
    section: "Layout",
    keywords: "width height size scale",
    params: [
      { key: "width", label: "Width (px)", type: "number" },
      { key: "height", label: "Height (px)", type: "number" },
    ],
    handler: (msg: any) => {
      const w = parseFloat(msg?.width);
      const h = parseFloat(msg?.height);
      if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
        figma.notify("Invalid dimensions");
        return;
      }
      let c = 0;
      for (const n of figma.currentPage.selection) {
        if ("resize" in n) { (n as any).resize(w, h); c++; }
      }
      figma.notify(c ? `Resized ${c} layer(s) to ${w}x${h}` : "No layers selected");
    },
  },
  {
    id: "distribute-h",
    name: "Distribute Horizontally",
    section: "Layout",
    keywords: "space even horizontal",
    handler: () => {
      const sel = figma.currentPage.selection.filter(
        (n): n is SceneNode & { x: number; width: number } => "x" in n
      );
      if (sel.length < 3) { figma.notify("Select 3+ layers"); return; }
      const sorted = [...sel].sort((a, b) => a.x - b.x);
      const first = sorted[0], last = sorted[sorted.length - 1];
      const total = last.x + last.width - first.x;
      const content = sorted.reduce((s, n) => s + n.width, 0);
      const gap = (total - content) / (sorted.length - 1);
      let cx = first.x + first.width + gap;
      for (let i = 1; i < sorted.length - 1; i++) {
        sorted[i].x = cx;
        cx += sorted[i].width + gap;
      }
      figma.notify("Distributed horizontally");
    },
  },
  {
    id: "distribute-v",
    name: "Distribute Vertically",
    section: "Layout",
    keywords: "space even vertical",
    handler: () => {
      const sel = figma.currentPage.selection.filter(
        (n): n is SceneNode & { y: number; height: number } => "y" in n
      );
      if (sel.length < 3) { figma.notify("Select 3+ layers"); return; }
      const sorted = [...sel].sort((a, b) => a.y - b.y);
      const first = sorted[0], last = sorted[sorted.length - 1];
      const total = last.y + last.height - first.y;
      const content = sorted.reduce((s, n) => s + n.height, 0);
      const gap = (total - content) / (sorted.length - 1);
      let cy = first.y + first.height + gap;
      for (let i = 1; i < sorted.length - 1; i++) {
        sorted[i].y = cy;
        cy += sorted[i].height + gap;
      }
      figma.notify("Distributed vertically");
    },
  },
  {
    id: "auto-layout-h",
    name: "Wrap in Auto Layout (Horizontal)",
    section: "Layout",
    keywords: "flex row frame",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (!sel.length) { figma.notify("No layers selected"); return; }
      const f = figma.createFrame();
      f.layoutMode = "HORIZONTAL";
      f.itemSpacing = 16;
      f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = 16;
      f.primaryAxisSizingMode = "AUTO";
      f.counterAxisSizingMode = "AUTO";
      f.name = "Auto Layout";
      const parent = sel[0].parent || figma.currentPage;
      (parent as ChildrenMixin).appendChild(f);
      for (const n of sel) f.appendChild(n);
      figma.currentPage.selection = [f];
      figma.notify("Wrapped in horizontal auto layout");
    },
  },
  {
    id: "auto-layout-v",
    name: "Wrap in Auto Layout (Vertical)",
    section: "Layout",
    keywords: "flex column frame stack",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (!sel.length) { figma.notify("No layers selected"); return; }
      const f = figma.createFrame();
      f.layoutMode = "VERTICAL";
      f.itemSpacing = 16;
      f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = 16;
      f.primaryAxisSizingMode = "AUTO";
      f.counterAxisSizingMode = "AUTO";
      f.name = "Auto Layout";
      const parent = sel[0].parent || figma.currentPage;
      (parent as ChildrenMixin).appendChild(f);
      for (const n of sel) f.appendChild(n);
      figma.currentPage.selection = [f];
      figma.notify("Wrapped in vertical auto layout");
    },
  },
  {
    id: "set-gap-0",
    name: "Set Auto Layout Gap 0",
    section: "Layout",
    keywords: "spacing tight",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("layoutMode" in n && (n as FrameNode).layoutMode !== "NONE")
          (n as FrameNode).itemSpacing = 0;
      figma.notify("Gap set to 0");
    },
  },
  {
    id: "set-gap-8",
    name: "Set Auto Layout Gap 8",
    section: "Layout",
    keywords: "spacing",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("layoutMode" in n && (n as FrameNode).layoutMode !== "NONE")
          (n as FrameNode).itemSpacing = 8;
      figma.notify("Gap set to 8");
    },
  },
  {
    id: "set-gap-16",
    name: "Set Auto Layout Gap 16",
    section: "Layout",
    keywords: "spacing",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("layoutMode" in n && (n as FrameNode).layoutMode !== "NONE")
          (n as FrameNode).itemSpacing = 16;
      figma.notify("Gap set to 16");
    },
  },
  {
    id: "set-gap-24",
    name: "Set Auto Layout Gap 24",
    section: "Layout",
    keywords: "spacing",
    handler: () => {
      for (const n of figma.currentPage.selection)
        if ("layoutMode" in n && (n as FrameNode).layoutMode !== "NONE")
          (n as FrameNode).itemSpacing = 24;
      figma.notify("Gap set to 24");
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  //  COMPONENTS
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "create-component",
    name: "Create Component from Selection",
    section: "Components",
    keywords: "symbol master reusable",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (!sel.length) { figma.notify("No layers selected"); return; }
      const comp = figma.createComponent();
      comp.resize(sel[0].width, sel[0].height);
      comp.name = sel[0].name + " Component";
      const parent = sel[0].parent || figma.currentPage;
      (parent as ChildrenMixin).appendChild(comp);
      for (const n of sel) comp.appendChild(n);
      figma.currentPage.selection = [comp];
      figma.notify("Component created");
    },
  },
  {
    id: "detach-instance",
    name: "Detach Instance",
    section: "Components",
    keywords: "unlink component separate",
    handler: () => {
      let c = 0;
      for (const n of figma.currentPage.selection) {
        if (n.type === "INSTANCE") { n.detachInstance(); c++; }
      }
      figma.notify(c ? `Detached ${c} instance(s)` : "No instances selected");
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  //  SELECTION
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "select-all",
    name: "Select All on Page",
    section: "Selection",
    keywords: "highlight everything",
    handler: () => {
      const nodes = figma.currentPage.children;
      figma.currentPage.selection = [...nodes];
      figma.notify(`Selected ${nodes.length} node(s)`);
    },
  },
  {
    id: "deselect-all",
    name: "Deselect All",
    section: "Selection",
    keywords: "clear none",
    handler: () => {
      figma.currentPage.selection = [];
      figma.notify("Deselected");
    },
  },
  {
    id: "select-all-text",
    name: "Select All Text Layers",
    section: "Selection",
    keywords: "type string find",
    handler: () => {
      const nodes = figma.currentPage.findAll((n) => n.type === "TEXT");
      figma.currentPage.selection = nodes;
      figma.notify(`Selected ${nodes.length} text layer(s)`);
    },
  },
  {
    id: "select-all-frames",
    name: "Select All Frames",
    section: "Selection",
    keywords: "artboard container find",
    handler: () => {
      const nodes = figma.currentPage.findAll((n) => n.type === "FRAME");
      figma.currentPage.selection = nodes;
      figma.notify(`Selected ${nodes.length} frame(s)`);
    },
  },
  {
    id: "select-all-images",
    name: "Select All Images",
    section: "Selection",
    keywords: "photo bitmap find",
    handler: () => {
      const nodes = figma.currentPage.findAll((n) => {
        if ("fills" in n) {
          const fills = (n as GeometryMixin).fills;
          return Array.isArray(fills) && fills.some((f) => f.type === "IMAGE");
        }
        return false;
      });
      figma.currentPage.selection = nodes;
      figma.notify(`Selected ${nodes.length} image layer(s)`);
    },
  },
  {
    id: "select-all-components",
    name: "Select All Component Instances",
    section: "Selection",
    keywords: "symbol find",
    handler: () => {
      const nodes = figma.currentPage.findAll((n) => n.type === "INSTANCE");
      figma.currentPage.selection = nodes;
      figma.notify(`Selected ${nodes.length} instance(s)`);
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  //  NAVIGATION
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "zoom-to-selection",
    name: "Zoom to Selection",
    section: "Navigation",
    keywords: "focus view center",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (!sel.length) { figma.notify("No layers selected"); return; }
      figma.viewport.scrollAndZoomIntoView(sel);
      figma.notify("Zoomed to selection");
    },
  },
  {
    id: "zoom-to-fit",
    name: "Zoom to Fit Page",
    section: "Navigation",
    keywords: "overview all",
    handler: () => {
      const nodes = figma.currentPage.children;
      if (!nodes.length) { figma.notify("Page is empty"); return; }
      figma.viewport.scrollAndZoomIntoView([...nodes]);
    },
  },
  {
    id: "next-page",
    name: "Go to Next Page",
    section: "Navigation",
    keywords: "forward advance",
    handler: () => {
      const pages = figma.root.children;
      const idx = pages.indexOf(figma.currentPage);
      if (idx < pages.length - 1) {
        figma.currentPage = pages[idx + 1];
        figma.notify(`Page: ${pages[idx + 1].name}`);
      } else {
        figma.notify("Already on last page");
      }
    },
  },
  {
    id: "prev-page",
    name: "Go to Previous Page",
    section: "Navigation",
    keywords: "back",
    handler: () => {
      const pages = figma.root.children;
      const idx = pages.indexOf(figma.currentPage);
      if (idx > 0) {
        figma.currentPage = pages[idx - 1];
        figma.notify(`Page: ${pages[idx - 1].name}`);
      } else {
        figma.notify("Already on first page");
      }
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  //  CLEANUP
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "remove-hidden",
    name: "Remove Hidden Layers",
    section: "Cleanup",
    keywords: "delete invisible tidy",
    handler: () => {
      const hidden = figma.currentPage.findAll((n) => !n.visible);
      const c = hidden.length;
      hidden.forEach((n) => n.remove());
      figma.notify(c ? `Removed ${c} hidden layer(s)` : "No hidden layers");
    },
  },
  {
    id: "remove-empty-groups",
    name: "Remove Empty Groups",
    section: "Cleanup",
    keywords: "delete tidy clean",
    handler: () => {
      let c = 0;
      figma.currentPage.findAll((n) => {
        if (n.type === "GROUP" && n.children.length === 0) { n.remove(); c++; }
        return false;
      });
      figma.notify(c ? `Removed ${c} empty group(s)` : "No empty groups");
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "duplicate-selection",
    name: "Duplicate Selection",
    section: "Utilities",
    keywords: "copy clone",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (!sel.length) { figma.notify("No layers selected"); return; }
      const cloneable = sel.filter(
        (n): n is SceneNode & { clone(): SceneNode } => "clone" in n
      );
      const clones = cloneable.map((n) => {
        const c = n.clone();
        if ("x" in c) (c as any).x += 20;
        if ("y" in c) (c as any).y += 20;
        return c;
      });
      figma.currentPage.selection = clones;
      figma.notify(`Duplicated ${clones.length} layer(s)`);
    },
  },
  {
    id: "delete-selection",
    name: "Delete Selection",
    section: "Utilities",
    keywords: "remove trash destroy",
    handler: () => {
      const sel = figma.currentPage.selection;
      if (!sel.length) { figma.notify("No layers selected"); return; }
      const c = sel.length;
      for (const n of sel) n.remove();
      figma.notify(`Deleted ${c} layer(s)`);
    },
  },
];

export default catalog;
