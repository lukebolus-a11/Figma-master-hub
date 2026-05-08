import catalog, { getCatalogMeta } from "./catalog";

const KEYS = {
  enabled: "kbar-enabled",
  favorites: "kbar-favorites",
  recents: "kbar-recents",
  macros: "kbar-macros",
};

const handlers = new Map(catalog.map((c) => [c.id, c.handler]));
const allIds = catalog.map((c) => c.id);
const MAX_RECENTS = 8;

// ── Storage helpers ─────────────────────────────────────────────────
async function getList(key: string, fallback: any[] = []): Promise<any[]> {
  return (await figma.clientStorage.getAsync(key)) ?? fallback;
}
async function setList(key: string, val: any[]) {
  await figma.clientStorage.setAsync(key, val);
}

async function pushRecent(id: string) {
  const recents: string[] = await getList(KEYS.recents);
  const updated = [id, ...recents.filter((r) => r !== id)].slice(0, MAX_RECENTS);
  await setList(KEYS.recents, updated);
  return updated;
}

// ── Launch ──────────────────────────────────────────────────────────
figma.showUI(__html__, { width: 580, height: 500, themeColors: true });

(async () => {
  const [enabled, favorites, recents, macros] = await Promise.all([
    getList(KEYS.enabled, allIds),
    getList(KEYS.favorites),
    getList(KEYS.recents),
    getList(KEYS.macros),
  ]);
  figma.ui.postMessage({
    type: "init",
    catalog: getCatalogMeta(catalog),
    enabled,
    favorites,
    recents,
    macros,
  });
})();

// ── Message handler ─────────────────────────────────────────────────
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "close":
      figma.closePlugin();
      return;

    case "set-enabled":
      await setList(KEYS.enabled, msg.ids);
      return;

    case "set-favorites":
      await setList(KEYS.favorites, msg.ids);
      return;

    case "exec": {
      const handler = handlers.get(msg.id);
      if (handler) {
        await handler(msg);
        const recents = await pushRecent(msg.id);
        figma.ui.postMessage({ type: "recents-updated", recents });
      } else {
        figma.notify(`Unknown command: ${msg.id}`);
      }
      return;
    }

    case "exec-macro": {
      const macros: any[] = await getList(KEYS.macros);
      const macro = macros.find((m) => m.id === msg.id);
      if (!macro) { figma.notify("Macro not found"); return; }
      for (const step of macro.steps) {
        const handler = handlers.get(step.id);
        if (handler) await handler(step.params || {});
      }
      const recents = await pushRecent(`macro:${msg.id}`);
      figma.ui.postMessage({ type: "recents-updated", recents });
      figma.notify(`Macro "${macro.name}" complete`);
      return;
    }

    case "save-macro": {
      const macros: any[] = await getList(KEYS.macros);
      const existing = macros.findIndex((m) => m.id === msg.macro.id);
      if (existing >= 0) macros[existing] = msg.macro;
      else macros.push(msg.macro);
      await setList(KEYS.macros, macros);
      figma.ui.postMessage({ type: "macros-updated", macros });
      figma.notify(`Macro "${msg.macro.name}" saved`);
      return;
    }

    case "delete-macro": {
      const macros: any[] = await getList(KEYS.macros);
      const filtered = macros.filter((m) => m.id !== msg.id);
      await setList(KEYS.macros, filtered);
      figma.ui.postMessage({ type: "macros-updated", macros: filtered });
      figma.notify("Macro deleted");
      return;
    }
  }
};
