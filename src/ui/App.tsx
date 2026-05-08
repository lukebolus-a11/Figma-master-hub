import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  KBarProvider,
  KBarSearch,
  KBarResults,
  useMatches,
  useRegisterActions,
  useKBar,
  VisualState,
  Action,
} from "kbar";

// ── Types ───────────────────────────────────────────────────────────
interface ParamDef { key: string; label: string; type: "text" | "number"; }
interface CatalogMeta {
  id: string; name: string; section: string; keywords: string; params?: ParamDef[];
}
interface MacroStep { id: string; name: string; params?: Record<string, any>; }
interface Macro { id: string; name: string; steps: MacroStep[]; }

type View = "palette" | "manage" | "prompt" | "macros" | "macro-builder";

// ── Helpers ─────────────────────────────────────────────────────────
function send(type: string, payload?: Record<string, any>) {
  parent.postMessage({ pluginMessage: { type, ...payload } }, "*");
}

// ── Main App ────────────────────────────────────────────────────────
export default function App() {
  const [catalog, setCatalog] = useState<CatalogMeta[]>([]);
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [view, setView] = useState<View>("palette");
  const [promptCmd, setPromptCmd] = useState<CatalogMeta | null>(null);
  const [editingMacro, setEditingMacro] = useState<Macro | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data?.pluginMessage;
      if (!msg) return;
      if (msg.type === "init") {
        setCatalog(msg.catalog);
        setEnabled(new Set(msg.enabled));
        setFavorites(msg.favorites || []);
        setRecents(msg.recents || []);
        setMacros(msg.macros || []);
        setReady(true);
      }
      if (msg.type === "recents-updated") setRecents(msg.recents);
      if (msg.type === "macros-updated") setMacros(msg.macros);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const toggleEnabled = useCallback((id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      send("set-enabled", { ids: Array.from(next) });
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      send("set-favorites", { ids: next });
      return next;
    });
  }, []);

  const enableAll = useCallback(() => {
    const all = new Set(catalog.map((c) => c.id));
    setEnabled(all);
    send("set-enabled", { ids: Array.from(all) });
  }, [catalog]);

  const disableAll = useCallback(() => {
    setEnabled(new Set());
    send("set-enabled", { ids: [] });
  }, []);

  const handleExec = useCallback((cmd: CatalogMeta) => {
    if (cmd.params?.length) {
      setPromptCmd(cmd);
      setView("prompt");
    } else {
      send("exec", { id: cmd.id });
    }
  }, []);

  const handleExecMacro = useCallback((macro: Macro) => {
    send("exec-macro", { id: macro.id });
  }, []);

  if (!ready) return <div style={loadingStyle}>Loading...</div>;

  const catalogMap = new Map(catalog.map((c) => [c.id, c]));

  if (view === "prompt" && promptCmd) {
    return (
      <PromptView
        cmd={promptCmd}
        onSubmit={(params) => {
          send("exec", { id: promptCmd.id, ...params });
          setPromptCmd(null);
          setView("palette");
        }}
        onCancel={() => { setPromptCmd(null); setView("palette"); }}
      />
    );
  }

  if (view === "macro-builder") {
    return (
      <MacroBuilderView
        catalog={catalog}
        enabled={enabled}
        initial={editingMacro}
        onSave={(macro) => {
          send("save-macro", { macro });
          setEditingMacro(null);
          setView("macros");
        }}
        onCancel={() => { setEditingMacro(null); setView("macros"); }}
      />
    );
  }

  if (view === "macros") {
    return (
      <MacrosView
        macros={macros}
        onRun={handleExecMacro}
        onEdit={(m) => { setEditingMacro(m); setView("macro-builder"); }}
        onDelete={(id) => send("delete-macro", { id })}
        onCreate={() => { setEditingMacro(null); setView("macro-builder"); }}
        onBack={() => setView("palette")}
      />
    );
  }

  if (view === "manage") {
    return (
      <ManageView
        catalog={catalog}
        enabled={enabled}
        favorites={favorites}
        onToggleEnabled={toggleEnabled}
        onToggleFavorite={toggleFavorite}
        onEnableAll={enableAll}
        onDisableAll={disableAll}
        onBack={() => setView("palette")}
      />
    );
  }

  return (
    <KBarProvider actions={[]}>
      <PaletteView
        catalog={catalog}
        catalogMap={catalogMap}
        enabled={enabled}
        favorites={favorites}
        recents={recents}
        macros={macros}
        onExec={handleExec}
        onExecMacro={handleExecMacro}
        onManage={() => setView("manage")}
        onMacros={() => setView("macros")}
        onToggleFavorite={toggleFavorite}
      />
    </KBarProvider>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  PALETTE VIEW
// ═════════════════════════════════════════════════════════════════════

function PaletteView({
  catalog, catalogMap, enabled, favorites, recents, macros,
  onExec, onExecMacro, onManage, onMacros, onToggleFavorite,
}: {
  catalog: CatalogMeta[];
  catalogMap: Map<string, CatalogMeta>;
  enabled: Set<string>;
  favorites: string[];
  recents: string[];
  macros: Macro[];
  onExec: (cmd: CatalogMeta) => void;
  onExecMacro: (m: Macro) => void;
  onManage: () => void;
  onMacros: () => void;
  onToggleFavorite: (id: string) => void;
}) {
  const actions: Action[] = [];

  // Favorites first
  const favCmds = favorites.filter((id) => enabled.has(id) && catalogMap.has(id));
  if (favCmds.length > 0) {
    for (const id of favCmds) {
      const c = catalogMap.get(id)!;
      actions.push({
        id: `fav:${c.id}`,
        name: c.name,
        section: "Favorites",
        keywords: c.keywords,
        perform: () => onExec(c),
      });
    }
  }

  // Recents (skip those already in favorites)
  const recentCmds = recents.filter(
    (id) => !id.startsWith("macro:") && enabled.has(id) && catalogMap.has(id) && !favorites.includes(id)
  );
  if (recentCmds.length > 0) {
    for (const id of recentCmds) {
      const c = catalogMap.get(id)!;
      actions.push({
        id: `recent:${c.id}`,
        name: c.name,
        section: "Recent",
        keywords: "",
        perform: () => onExec(c),
      });
    }
  }

  // Macros
  for (const m of macros) {
    actions.push({
      id: `macro:${m.id}`,
      name: m.name,
      section: "Macros",
      keywords: "chain sequence",
      perform: () => onExecMacro(m),
    });
  }

  // All enabled commands
  for (const c of catalog) {
    if (!enabled.has(c.id)) continue;
    actions.push({
      id: c.id,
      name: c.name,
      section: c.section,
      keywords: c.keywords,
      perform: () => onExec(c),
    });
  }

  // Settings actions
  actions.push(
    { id: "__manage__", name: "Manage Commands...", section: "Settings", keywords: "settings configure toggle", perform: onManage },
    { id: "__macros__", name: "Manage Macros...", section: "Settings", keywords: "chain sequence builder", perform: onMacros },
    { id: "__close__", name: "Close Hub", section: "Settings", keywords: "exit quit", perform: () => send("close") },
  );

  return (
    <div style={containerStyle}>
      <DynamicActions actions={actions} />
      <KeepKBarOpen />
      <KBarSearch defaultPlaceholder="Search commands..." style={searchStyle} />
      <div style={resultsContainerStyle}>
        <RenderResults favorites={favorites} onToggleFavorite={onToggleFavorite} />
      </div>
      <div style={footerStyle}>
        <span style={footerCountStyle}>
          {enabled.size} commands | {macros.length} macros
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onMacros} style={footerBtnStyle}>Macros</button>
          <button onClick={onManage} style={footerBtnStyle}>Manage</button>
        </div>
      </div>
    </div>
  );
}

function KeepKBarOpen() {
  const { query } = useKBar((state) => ({ visualState: state.visualState }));
  const interval = useRef<number>();
  useEffect(() => {
    query.setVisualState(VisualState.showing);
    interval.current = window.setInterval(() => {
      query.setVisualState(VisualState.showing);
    }, 200);
    return () => clearInterval(interval.current);
  }, [query]);
  return null;
}

function DynamicActions({ actions }: { actions: Action[] }) {
  useRegisterActions(actions, [actions]);
  return null;
}

function RenderResults({ favorites, onToggleFavorite }: { favorites: string[]; onToggleFavorite: (id: string) => void }) {
  const { results } = useMatches();
  if (results.length === 0) return <div style={emptyStyle}>No matching commands</div>;

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div style={sectionLabelStyle}>{item}</div>
        ) : (
          <div
            style={{
              ...rowStyle,
              background: active ? "var(--figma-color-bg-brand, #0D99FF)" : "transparent",
              color: active ? "#fff" : "var(--figma-color-text, #e5e5e5)",
            }}
          >
            <span style={{ flex: 1 }}>{item.name}</span>
            {/* Show star toggle for non-system actions */}
            {!item.id.startsWith("__") && !item.id.startsWith("macro:") && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  const realId = item.id.replace(/^(fav|recent):/, "");
                  onToggleFavorite(realId);
                }}
                style={{
                  ...starStyle,
                  opacity: favorites.includes(item.id.replace(/^(fav|recent):/, "")) ? 1 : 0.3,
                }}
                title="Toggle favorite"
              >
                *
              </span>
            )}
          </div>
        )
      }
    />
  );
}

// ═════════════════════════════════════════════════════════════════════
//  PROMPT VIEW — input fields for parameterized commands
// ═════════════════════════════════════════════════════════════════════

function PromptView({
  cmd, onSubmit, onCancel,
}: {
  cmd: CatalogMeta;
  onSubmit: (params: Record<string, any>) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Record<string, any> = {};
    for (const p of cmd.params!) {
      out[p.key] = p.type === "number" ? parseFloat(values[p.key] || "0") : values[p.key] || "";
    }
    onSubmit(out);
  };

  return (
    <div style={containerStyle}>
      <div style={promptHeaderStyle}>
        <button onClick={onCancel} style={backBtnStyle}>&larr;</button>
        <span style={promptTitleStyle}>{cmd.name}</span>
      </div>
      <form onSubmit={handleSubmit} style={promptFormStyle}>
        {cmd.params!.map((p, i) => (
          <div key={p.key} style={promptFieldStyle}>
            <label style={promptLabelStyle}>{p.label}</label>
            <input
              ref={i === 0 ? firstRef : undefined}
              type={p.type === "number" ? "number" : "text"}
              value={values[p.key] || ""}
              onChange={(e) => setValues((v) => ({ ...v, [p.key]: e.target.value }))}
              style={promptInputStyle}
              placeholder={p.label}
            />
          </div>
        ))}
        <div style={promptActionsStyle}>
          <button type="button" onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button type="submit" style={applyBtnStyle}>Apply</button>
        </div>
      </form>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  MANAGE VIEW
// ═════════════════════════════════════════════════════════════════════

function ManageView({
  catalog, enabled, favorites, onToggleEnabled, onToggleFavorite, onEnableAll, onDisableAll, onBack,
}: {
  catalog: CatalogMeta[];
  enabled: Set<string>;
  favorites: string[];
  onToggleEnabled: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState("");
  const sections: Record<string, CatalogMeta[]> = {};
  for (const c of catalog) {
    if (filter && !c.name.toLowerCase().includes(filter.toLowerCase()) &&
        !c.keywords.toLowerCase().includes(filter.toLowerCase())) continue;
    if (!sections[c.section]) sections[c.section] = [];
    sections[c.section].push(c);
  }

  return (
    <div style={containerStyle}>
      <div style={manageHeaderStyle}>
        <button onClick={onBack} style={backBtnStyle}>&larr; Back</button>
        <span style={manageTitleStyle}>Manage Commands</span>
        <span style={manageCountStyle}>{enabled.size} active</span>
      </div>
      <input type="text" placeholder="Filter commands..." value={filter}
        onChange={(e) => setFilter(e.target.value)} style={manageSearchStyle} autoFocus />
      <div style={bulkBarStyle}>
        <button onClick={onEnableAll} style={bulkBtnStyle}>Enable All</button>
        <button onClick={onDisableAll} style={bulkBtnStyle}>Disable All</button>
      </div>
      <div style={listStyle}>
        {Object.entries(sections).map(([section, commands]) => (
          <div key={section}>
            <div style={manageSectionStyle}>{section}</div>
            {commands.map((c) => (
              <div key={c.id} style={manageRowStyle}>
                <span
                  onClick={() => onToggleFavorite(c.id)}
                  style={{ ...starBtnStyle, opacity: favorites.includes(c.id) ? 1 : 0.25 }}
                  title="Toggle favorite"
                >*</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <ToggleSwitch checked={enabled.has(c.id)} onChange={() => onToggleEnabled(c.id)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  MACROS VIEW
// ═════════════════════════════════════════════════════════════════════

function MacrosView({
  macros, onRun, onEdit, onDelete, onCreate, onBack,
}: {
  macros: Macro[];
  onRun: (m: Macro) => void;
  onEdit: (m: Macro) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onBack: () => void;
}) {
  return (
    <div style={containerStyle}>
      <div style={manageHeaderStyle}>
        <button onClick={onBack} style={backBtnStyle}>&larr; Back</button>
        <span style={manageTitleStyle}>Macros</span>
        <button onClick={onCreate} style={applyBtnStyle}>+ New</button>
      </div>
      <div style={listStyle}>
        {macros.length === 0 && (
          <div style={emptyStyle}>
            No macros yet. Create one to chain multiple commands together.
          </div>
        )}
        {macros.map((m) => (
          <div key={m.id} style={macroRowStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
              <div style={macroStepsPreviewStyle}>
                {m.steps.map((s) => s.name).join(" → ")}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => onRun(m)} style={macroActionBtnStyle} title="Run">Run</button>
              <button onClick={() => onEdit(m)} style={macroActionBtnStyle} title="Edit">Edit</button>
              <button onClick={() => onDelete(m.id)} style={{ ...macroActionBtnStyle, color: "#f55" }} title="Delete">Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  MACRO BUILDER VIEW
// ═════════════════════════════════════════════════════════════════════

function MacroBuilderView({
  catalog, enabled, initial, onSave, onCancel,
}: {
  catalog: CatalogMeta[];
  enabled: Set<string>;
  initial: Macro | null;
  onSave: (macro: Macro) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [steps, setSteps] = useState<MacroStep[]>(initial?.steps || []);
  const [filter, setFilter] = useState("");

  const addStep = (cmd: CatalogMeta) => {
    setSteps((s) => [...s, { id: cmd.id, name: cmd.name }]);
  };

  const removeStep = (idx: number) => {
    setSteps((s) => s.filter((_, i) => i !== idx));
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    setSteps((s) => {
      const arr = [...s];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (steps.length === 0) return;
    onSave({
      id: initial?.id || `macro-${Date.now()}`,
      name: name.trim(),
      steps,
    });
  };

  const available = catalog.filter((c) => {
    if (!enabled.has(c.id)) return false;
    if (!filter) return true;
    const f = filter.toLowerCase();
    return c.name.toLowerCase().includes(f) || c.keywords.toLowerCase().includes(f);
  });

  return (
    <div style={containerStyle}>
      <div style={manageHeaderStyle}>
        <button onClick={onCancel} style={backBtnStyle}>&larr;</button>
        <span style={manageTitleStyle}>{initial ? "Edit Macro" : "New Macro"}</span>
      </div>

      {/* Name */}
      <input
        type="text" placeholder="Macro name..." value={name}
        onChange={(e) => setName(e.target.value)} style={manageSearchStyle} autoFocus
      />

      {/* Steps */}
      <div style={builderSectionHeader}>Steps ({steps.length})</div>
      <div style={stepsContainerStyle}>
        {steps.length === 0 && <div style={emptyStyle}>Add commands below to build your macro</div>}
        {steps.map((s, i) => (
          <div key={`${s.id}-${i}`} style={stepRowStyle}>
            <span style={stepNumberStyle}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 12 }}>{s.name}</span>
            <button onClick={() => moveStep(i, -1)} style={stepBtnStyle} title="Move up">&uarr;</button>
            <button onClick={() => moveStep(i, 1)} style={stepBtnStyle} title="Move down">&darr;</button>
            <button onClick={() => removeStep(i)} style={{ ...stepBtnStyle, color: "#f55" }}>x</button>
          </div>
        ))}
      </div>

      {/* Available commands */}
      <div style={builderSectionHeader}>Add Commands</div>
      <input type="text" placeholder="Filter..." value={filter}
        onChange={(e) => setFilter(e.target.value)} style={manageSearchStyle} />
      <div style={addCommandsListStyle}>
        {available.map((c) => (
          <div key={c.id} style={addCommandRowStyle} onClick={() => addStep(c)}>
            <span style={{ flex: 1, fontSize: 12 }}>{c.name}</span>
            <span style={addBtnStyle}>+</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={promptActionsStyle}>
        <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
        <button onClick={handleSave} style={applyBtnStyle}
          disabled={!name.trim() || steps.length === 0}>Save Macro</button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ═════════════════════════════════════════════════════════════════════

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      ...toggleTrackStyle,
      background: checked ? "var(--figma-color-bg-brand, #0D99FF)" : "rgba(255,255,255,0.15)",
    }}>
      <div style={{
        ...toggleThumbStyle,
        transform: checked ? "translateX(16px)" : "translateX(2px)",
      }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════

const containerStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", height: "100vh",
  background: "var(--figma-color-bg, #2c2c2c)",
};

const loadingStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  height: "100%", color: "var(--figma-color-text-secondary, #999)", fontSize: 14,
};

const searchStyle: React.CSSProperties = {
  padding: "14px 16px", fontSize: 15, width: "100%", boxSizing: "border-box",
  outline: "none", border: "none",
  borderBottom: "1px solid var(--figma-color-border, #444)",
  background: "transparent", color: "var(--figma-color-text, #e5e5e5)",
};

const resultsContainerStyle: React.CSSProperties = { flex: 1, overflowY: "auto" };

const emptyStyle: React.CSSProperties = {
  padding: "20px 16px", textAlign: "center", fontSize: 12,
  color: "var(--figma-color-text-secondary, #999)",
};

const footerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "8px 16px", borderTop: "1px solid var(--figma-color-border, #444)", flexShrink: 0,
};

const footerCountStyle: React.CSSProperties = {
  fontSize: 11, color: "var(--figma-color-text-secondary, #999)",
};

const footerBtnStyle: React.CSSProperties = {
  fontSize: 11, padding: "4px 10px", borderRadius: 4,
  border: "1px solid var(--figma-color-border, #555)",
  background: "transparent", color: "var(--figma-color-text, #e5e5e5)", cursor: "pointer",
};

const sectionLabelStyle: React.CSSProperties = {
  padding: "8px 16px 4px", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em",
  color: "var(--figma-color-text-secondary, #999)",
};

const rowStyle: React.CSSProperties = {
  padding: "10px 16px", fontSize: 14, cursor: "pointer",
  borderRadius: 4, margin: "0 4px", display: "flex", alignItems: "center",
};

const starStyle: React.CSSProperties = {
  fontSize: 16, cursor: "pointer", padding: "0 4px", fontWeight: 700,
  color: "var(--figma-color-bg-brand, #0D99FF)",
};

// ── Manage styles ───────────────────────────────────────────────────

const manageHeaderStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
  borderBottom: "1px solid var(--figma-color-border, #444)",
};

const backBtnStyle: React.CSSProperties = {
  fontSize: 13, padding: "4px 8px", borderRadius: 4,
  border: "1px solid var(--figma-color-border, #555)",
  background: "transparent", color: "var(--figma-color-text, #e5e5e5)", cursor: "pointer",
};

const manageTitleStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, flex: 1, color: "var(--figma-color-text, #e5e5e5)",
};

const manageCountStyle: React.CSSProperties = {
  fontSize: 11, color: "var(--figma-color-text-secondary, #999)",
};

const manageSearchStyle: React.CSSProperties = {
  padding: "10px 16px", fontSize: 13, border: "none",
  borderBottom: "1px solid var(--figma-color-border, #444)",
  outline: "none", background: "transparent",
  color: "var(--figma-color-text, #e5e5e5)", boxSizing: "border-box", width: "100%",
};

const bulkBarStyle: React.CSSProperties = {
  display: "flex", gap: 8, padding: "8px 16px",
  borderBottom: "1px solid var(--figma-color-border, #444)",
};

const bulkBtnStyle: React.CSSProperties = {
  fontSize: 11, padding: "4px 10px", borderRadius: 4,
  border: "1px solid var(--figma-color-border, #555)",
  background: "transparent", color: "var(--figma-color-text, #e5e5e5)", cursor: "pointer",
};

const listStyle: React.CSSProperties = { flex: 1, overflowY: "auto", padding: "4px 0" };

const manageSectionStyle: React.CSSProperties = {
  padding: "12px 16px 4px", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em",
  color: "var(--figma-color-text-secondary, #999)",
};

const manageRowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", padding: "8px 16px",
  fontSize: 13, color: "var(--figma-color-text, #e5e5e5)", gap: 8,
};

const starBtnStyle: React.CSSProperties = {
  fontSize: 16, cursor: "pointer", fontWeight: 700, lineHeight: 1,
  color: "var(--figma-color-bg-brand, #0D99FF)",
};

const toggleTrackStyle: React.CSSProperties = {
  width: 36, height: 20, borderRadius: 10, cursor: "pointer",
  transition: "background 0.15s", flexShrink: 0, position: "relative",
};

const toggleThumbStyle: React.CSSProperties = {
  width: 16, height: 16, borderRadius: 8, background: "#fff",
  position: "absolute", top: 2, transition: "transform 0.15s",
};

// ── Prompt styles ───────────────────────────────────────────────────

const promptHeaderStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
  borderBottom: "1px solid var(--figma-color-border, #444)",
};

const promptTitleStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: "var(--figma-color-text, #e5e5e5)",
};

const promptFormStyle: React.CSSProperties = {
  padding: 16, display: "flex", flexDirection: "column", gap: 12, flex: 1,
};

const promptFieldStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4,
};

const promptLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "var(--figma-color-text-secondary, #999)",
  textTransform: "uppercase", letterSpacing: "0.05em",
};

const promptInputStyle: React.CSSProperties = {
  padding: "10px 12px", fontSize: 14, borderRadius: 6,
  border: "1px solid var(--figma-color-border, #555)",
  background: "rgba(255,255,255,0.06)", color: "var(--figma-color-text, #e5e5e5)",
  outline: "none", boxSizing: "border-box", width: "100%",
};

const promptActionsStyle: React.CSSProperties = {
  display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px",
  borderTop: "1px solid var(--figma-color-border, #444)", flexShrink: 0,
};

const cancelBtnStyle: React.CSSProperties = {
  fontSize: 13, padding: "6px 14px", borderRadius: 6,
  border: "1px solid var(--figma-color-border, #555)",
  background: "transparent", color: "var(--figma-color-text, #e5e5e5)", cursor: "pointer",
};

const applyBtnStyle: React.CSSProperties = {
  fontSize: 13, padding: "6px 14px", borderRadius: 6, border: "none",
  background: "var(--figma-color-bg-brand, #0D99FF)", color: "#fff", cursor: "pointer",
  fontWeight: 600,
};

// ── Macro styles ────────────────────────────────────────────────────

const macroRowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", padding: "10px 16px", gap: 8,
  borderBottom: "1px solid var(--figma-color-border, #3a3a3a)",
  color: "var(--figma-color-text, #e5e5e5)",
};

const macroStepsPreviewStyle: React.CSSProperties = {
  fontSize: 11, color: "var(--figma-color-text-secondary, #999)", marginTop: 2,
};

const macroActionBtnStyle: React.CSSProperties = {
  fontSize: 11, padding: "3px 8px", borderRadius: 4,
  border: "1px solid var(--figma-color-border, #555)",
  background: "transparent", color: "var(--figma-color-text, #e5e5e5)", cursor: "pointer",
};

// ── Macro builder styles ────────────────────────────────────────────

const builderSectionHeader: React.CSSProperties = {
  padding: "8px 16px 4px", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em",
  color: "var(--figma-color-text-secondary, #999)",
  borderTop: "1px solid var(--figma-color-border, #444)",
};

const stepsContainerStyle: React.CSSProperties = {
  maxHeight: 140, overflowY: "auto",
};

const stepRowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", padding: "6px 16px", gap: 6,
  color: "var(--figma-color-text, #e5e5e5)",
};

const stepNumberStyle: React.CSSProperties = {
  width: 20, height: 20, borderRadius: 10, fontSize: 10, fontWeight: 700,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "var(--figma-color-bg-brand, #0D99FF)", color: "#fff", flexShrink: 0,
};

const stepBtnStyle: React.CSSProperties = {
  fontSize: 11, padding: "2px 6px", borderRadius: 3,
  border: "1px solid var(--figma-color-border, #555)",
  background: "transparent", color: "var(--figma-color-text, #e5e5e5)", cursor: "pointer",
};

const addCommandsListStyle: React.CSSProperties = {
  flex: 1, overflowY: "auto",
};

const addCommandRowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", padding: "6px 16px", gap: 8,
  cursor: "pointer", color: "var(--figma-color-text, #e5e5e5)",
};

const addBtnStyle: React.CSSProperties = {
  width: 20, height: 20, borderRadius: 10, fontSize: 14, fontWeight: 700,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(255,255,255,0.1)", color: "var(--figma-color-text, #e5e5e5)",
  flexShrink: 0,
};
