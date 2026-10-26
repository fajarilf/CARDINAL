"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Pin } from "lucide-react";
import { ErdNode, ErdEdge, ErdLegend, BOX_W, clamp, tableHeight } from "@/features/erd";
import { ConfirmDialog, IconButton, Input } from "@/components/ui";
import { CrowsFoot } from "@/components/crows-foot";
import { useToast } from "@/components/toast-provider";
import type {
  DesignSelection,
  DesignDocument,
  ErdColumn,
  ErdEdge as ErdEdgeModel,
  ErdEndpoint,
  ErdTable,
} from "../api/types";
import { makeId } from "../utils/ids";
import { saveDesign, removeDesignDraft, downloadJson, type StoredDesign } from "../utils/storage";
import { useSaveDesign } from "../api/use-designs";
import { hitTestColumn } from "../utils/hit-test";
import { getRelationshipError } from "../utils/relationships";
import { DesignToolbar } from "./design-toolbar";
import { DesignSidebar } from "./design-sidebar";
import { TableEditorDialog } from "./table-editor-dialog";
import { TableActionsMenu } from "./table-actions-menu";

/* ------------------------------------------------------------------ *
 * CARDINAL — ERD designer. Same canvas/pan/zoom/drag machinery as the
 * read-only viewer (features/erd), extended with: add/edit/delete
 * tables, drag-from-a-column-dot to draw relationships, click an edge
 * to select/delete it. Browser drafts autosave; backend saves are explicit.
 * ------------------------------------------------------------------ */

type DragState =
  | { kind: "entity"; id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean }
  | { kind: "pan"; sx: number; sy: number; otx: number; oty: number; moved: boolean }
  | { kind: "connect"; from: ErdEndpoint }
  | null;

const endpointKey = (e: ErdEndpoint) => `${e.table}.${e.col}`;

export default function CardinalErdDesign({
  designId,
  initialName,
  initialDocument,
  initialRevision,
}: {
  designId?: number;
  initialName: string;
  initialDocument: DesignDocument;
  initialRevision: number | null;
}) {
  const toast = useToast();
  const router = useRouter();
  const saveMutation = useSaveDesign();
  const [designName, setDesignName] = useState(initialName);
  const [revision, setRevision] = useState(initialRevision);
  const [redirecting, setRedirecting] = useState(false);
  const [doc, setDoc] = useState<DesignDocument>(initialDocument);
  const { tables, edges } = doc;
  const setTables = (updater: ErdTable[] | ((ts: ErdTable[]) => ErdTable[])) =>
    setDoc((d) => ({
      ...d,
      tables: typeof updater === "function" ? (updater as (ts: ErdTable[]) => ErdTable[])(d.tables) : updater,
    }));
  const setEdges = (updater: ErdEdgeModel[] | ((es: ErdEdgeModel[]) => ErdEdgeModel[])) =>
    setDoc((d) => ({
      ...d,
      edges: typeof updater === "function" ? (updater as (es: ErdEdgeModel[]) => ErdEdgeModel[])(d.edges) : updater,
    }));

  const [view, setView] = useState({ tx: 40, ty: 40, k: 0.9 });
  const [selection, setSelection] = useState<DesignSelection>(null);
  const [query, setQuery] = useState("");
  const [animate, setAnimate] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(true);
  const [sidebarPeek, setSidebarPeek] = useState(false);
  const [connectCursor, setConnectCursor] = useState<{ x: number; y: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<ErdEndpoint | null>(null);
  const [editing, setEditing] = useState(false);
  const [pendingTable, setPendingTable] = useState<ErdTable | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reduce] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestDraft = useRef<StoredDesign>({ ...initialDocument, name: initialName, revision: initialRevision });
  const savedRedirect = useRef(false);
  const saving = useRef(false);

  useEffect(() => {
    latestDraft.current = { tables, edges, name: designName, revision };
    autosaveTimer.current = setTimeout(() => {
      if (savedRedirect.current) return;
      try {
        saveDesign(latestDraft.current, designId);
      } catch {
        toast("Browser draft could not be saved. Save to the backend or download JSON before leaving.");
      }
    }, 400);
    return () => clearTimeout(autosaveTimer.current);
  }, [tables, edges, designName, revision, designId, toast]);

  useEffect(() => {
    const persist = () => {
      if (savedRedirect.current) return;
      try { saveDesign(latestDraft.current, designId); }
      catch { toast("Browser draft could not be saved. Use Save or download JSON to keep your changes."); }
    };
    window.addEventListener("pagehide", persist);
    return () => {
      window.removeEventListener("pagehide", persist);
      persist();
    };
  }, [designId, toast]);

  const saveToBackend = () => {
    if (saving.current) return;
    const name = designName.trim();
    if (!name) { toast("Enter a design name before saving."); return; }
    saving.current = true;
    saveMutation.mutate({ id: designId, name, document: doc, revision }, {
      onSuccess: (saved) => {
        clearTimeout(autosaveTimer.current);
        latestDraft.current = { ...saved.document, name: saved.name, revision: saved.revision };
        setDesignName(saved.name);
        setRevision(saved.revision);
        let draftSaved = true;
        try {
          saveDesign(latestDraft.current, saved.id);
          if (designId === undefined) removeDesignDraft();
        } catch { draftSaved = false; }
        toast(draftSaved ? `Saved ${saved.name}` : "Saved to backend, but the browser draft could not be updated.");
        if (designId === undefined) {
          savedRedirect.current = true;
          setRedirecting(true);
          router.replace(`/design/${saved.id}`);
        }
      },
      onError: (error) => toast(error.message),
      onSettled: () => { if (!savedRedirect.current) saving.current = false; },
    });
  };

  // fk is derived from edges, never stored on the column directly
  const fkCols = new Set(edges.map((e) => endpointKey(e.from)));
  const renderTables: ErdTable[] = tables.map((t) => ({
    ...t,
    columns: t.columns.map((c) => ({
      ...c,
      fk: fkCols.has(`${t.id}.${c.name}`) || undefined,
    })),
  }));

  const byId = useCallback(
    (id: string) => renderTables.find((t) => t.id === id),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- renderTables is derived fresh each render from tables/edges
    [tables, edges],
  );

  /* --- fit everything into view --- */
  const fit = useCallback(
    (ts: ErdTable[] = tables) => {
      const el = canvasRef.current;
      if (!el || ts.length === 0) return;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      ts.forEach((t) => {
        minX = Math.min(minX, t.x);
        minY = Math.min(minY, t.y);
        maxX = Math.max(maxX, t.x + BOX_W);
        maxY = Math.max(maxY, t.y + tableHeight(t));
      });
      const pad = 70;
      const k = Math.min(
        (cw - pad * 2) / (maxX - minX),
        (ch - pad * 2) / (maxY - minY),
        1.25,
      );
      const tx = (cw - (maxX - minX) * k) / 2 - minX * k;
      const ty = (ch - (maxY - minY) * k) / 2 - minY * k;
      setAnimate(true);
      setView({ tx, ty, k });
    },
    [tables],
  );

  useEffect(() => {
    fit(initialDocument.tables);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- frame the loaded document only once
  }, []);

  /* --- wheel zoom (manual listener so preventDefault works) --- */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 4) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setAnimate(false);
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.08 : 0.925;
        const k = clamp(v.k * factor, 0.35, 2);
        const wx = (mx - v.tx) / v.k;
        const wy = (my - v.ty) / v.k;
        return { k, tx: mx - wx * k, ty: my - wy * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* --- zoom buttons --- */
  const zoomBy = (factor: number) => {
    const el = canvasRef.current;
    const cw = el ? el.clientWidth / 2 : 0;
    const ch = el ? el.clientHeight / 2 : 0;
    setAnimate(true);
    setView((v) => {
      const k = clamp(v.k * factor, 0.35, 2);
      const wx = (cw - v.tx) / v.k;
      const wy = (ch - v.ty) / v.k;
      return { k, tx: cw - wx * k, ty: ch - wy * k };
    });
  };

  /* --- drag: entities move, background pans, connector dots draw a relationship --- */
  const startEntityDrag = (e: MouseEvent, t: ErdTable) => {
    e.stopPropagation();
    setSelection({ kind: "table", id: t.id });
    drag.current = {
      kind: "entity",
      id: t.id,
      sx: e.clientX,
      sy: e.clientY,
      ox: t.x,
      oy: t.y,
      moved: false,
    };
  };
  const startPan = (e: MouseEvent) => {
    if (e.button !== 0) return;
    drag.current = {
      kind: "pan",
      sx: e.clientX,
      sy: e.clientY,
      otx: view.tx,
      oty: view.ty,
      moved: false,
    };
  };
  const startConnect = (e: MouseEvent, tableId: string, columnName: string) => {
    const from = { table: tableId, col: columnName };
    drag.current = { kind: "connect", from };
    setConnectFrom(from);
    setConnectCursor({ x: e.clientX, y: e.clientY }); // corrected to world coords on first move
  };

  useEffect(() => {
    const toWorld = (clientX: number, clientY: number) => {
      const el = canvasRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      // ponytail: reads view.tx/ty from this closure — only re-created when
      // view.k changes, same as a wheel-zoom would. A pan can't happen mid-
      // connect (one mousedown gesture at a time), so this self-heals.
      return {
        x: (clientX - rect.left - view.tx) / view.k,
        y: (clientY - rect.top - view.ty) / view.k,
      };
    };

    const move = (e: globalThis.MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      if (d.kind === "connect") {
        setConnectCursor(toWorld(e.clientX, e.clientY));
        return;
      }
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      if (!d.moved && Math.hypot(dx, dy) > 3) {
        d.moved = true;
        setAnimate(false);
      }
      if (!d.moved) return;
      if (d.kind === "entity") {
        setTables((ts) =>
          ts.map((t) =>
            t.id === d.id
              ? { ...t, x: d.ox + dx / view.k, y: d.oy + dy / view.k }
              : t,
          ),
        );
      } else {
        setView((v) => ({ ...v, tx: d.otx + dx, ty: d.oty + dy }));
      }
    };

    const up = (e: globalThis.MouseEvent) => {
      const d = drag.current;
      if (d?.kind === "connect") {
        const world = toWorld(e.clientX, e.clientY);
        const to = hitTestColumn(world.x, world.y, tables);
        if (to) {
          const error = getRelationshipError(d.from, to, tables, edges);
          if (error) {
            toast(error);
          } else {
            setEdges((es) => [...es, { id: makeId("e"), from: d.from, to }]);
            toast("Foreign key added");
          }
        }
      } else if (d && !d.moved && d.kind === "pan") {
        setSelection(null);
      }
      drag.current = null;
      setConnectCursor(null);
      setConnectFrom(null);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [view.k, view.tx, view.ty, tables, edges, toast]);

  // Escape cancels an in-progress connect
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && drag.current?.kind === "connect") {
        drag.current = null;
        setConnectCursor(null);
        setConnectFrom(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* --- selection relationships (table selection only) --- */
  const selectedTableId = selection?.kind === "table" ? selection.id : null;
  const related = new Set<string>();
  const activeCols: Record<string, Set<string>> = {};
  if (selectedTableId) {
    edges.forEach((ed) => {
      if (ed.from.table === selectedTableId || ed.to.table === selectedTableId) {
        related.add(ed.from.table);
        related.add(ed.to.table);
        (activeCols[ed.from.table] ??= new Set()).add(ed.from.col);
        (activeCols[ed.to.table] ??= new Set()).add(ed.to.col);
      }
    });
  }

  const focusTable = (t: ErdTable) => {
    setSelection({ kind: "table", id: t.id });
    const el = canvasRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    setAnimate(true);
    setView((v) => ({
      k: v.k,
      tx: cw / 2 - (t.x + BOX_W / 2) * v.k,
      ty: ch / 2 - (t.y + tableHeight(t) / 2) * v.k,
    }));
  };

  const addTable = () => {
    const n = tables.length;
    const id = makeId("t");
    const name = `table_${n + 1}`;
    const newTable: ErdTable = {
      id,
      name,
      x: 80 + (n % 4) * 40,
      y: 80 + Math.floor(n / 4) * 40,
      columns: [{ name: "id", type: "integer", pk: true }],
    };
    setPendingTable(newTable);
  };

  const saveTable = (name: string, columns: ErdColumn[]) => {
    if (pendingTable) {
      const newTable = { ...pendingTable, name, columns };
      setTables((ts) => [...ts, newTable]);
      setPendingTable(null);
      focusTable(newTable);
      toast(`Added ${name}`);
      return;
    }
    if (!selectedTableId) return;
    const before = tables.find((t) => t.id === selectedTableId);
    const beforeNames = before?.columns.map((c) => c.name) ?? [];
    const afterNames = columns.map((c) => c.name);
    // columns have no stable id — repair edges by position when a name changed,
    // and drop edges pointing at a column that no longer exists
    const renameMap = new Map<string, string>();
    beforeNames.forEach((old, i) => {
      const next = afterNames[i];
      if (next && next !== old) renameMap.set(old, next);
    });
    const stillExists = new Set(afterNames);

    setTables((ts) => ts.map((t) => (t.id === selectedTableId ? { ...t, name, columns } : t)));
    setEdges((es) =>
      es.flatMap((ed) => {
        const patch = (ep: ErdEndpoint): ErdEndpoint | null => {
          if (ep.table !== selectedTableId) return ep;
          const renamed = renameMap.get(ep.col) ?? ep.col;
          if (!stillExists.has(renamed)) return null;
          return { ...ep, col: renamed };
        };
        const from = patch(ed.from);
        const to = patch(ed.to);
        if (!from || !to) return [];
        return [{ ...ed, from, to }];
      }),
    );
    setEditing(false);
    toast(`Saved ${name}`);
  };

  const deleteTable = () => {
    if (!selectedTableId) return;
    setTables((ts) => ts.filter((t) => t.id !== selectedTableId));
    setEdges((es) =>
      es.filter((ed) => ed.from.table !== selectedTableId && ed.to.table !== selectedTableId),
    );
    setSelection(null);
    setConfirmingDelete(false);
    toast("Table removed");
  };

  const deleteEdge = (id: string) => {
    setEdges((es) => es.filter((ed) => ed.id !== id));
    setSelection((s) => (s?.kind === "edge" && s.id === id ? null : s));
    toast("Relationship removed");
  };

  const deleteSelectedEdge = () => {
    if (selection?.kind === "edge") deleteEdge(selection.id);
  };

  const editingTable = pendingTable ?? (editing ? tables.find((t) => t.id === selectedTableId) : undefined);
  const relCount = selectedTableId
    ? edges.filter((e) => e.from.table === selectedTableId || e.to.table === selectedTableId).length
    : 0;
  const deleteTargetName = selectedTableId
    ? (tables.find((t) => t.id === selectedTableId)?.name ?? "this table")
    : "";

  // live preview line while dragging from a column's connector dot
  const connectSourceTable = connectFrom ? byId(connectFrom.table) : undefined;

  return (
    <div inert={saveMutation.isPending || redirecting} aria-busy={saveMutation.isPending || redirecting} className="h-screen flex flex-col overflow-hidden text-ink font-sans bg-paper antialiased">
      {/* top bar */}
      <header className="flex items-center justify-between gap-4 px-[18px] py-[11px] border-b-[1.5px] border-ink bg-paper z-[5]">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/"
            aria-label="Back to connections"
            title="Connections"
            className="flex items-center gap-2.5 shrink-0 rounded-[3px] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(177_116_87/0.14)]"
          >
            <span className="grid place-items-center w-[34px] h-[34px] text-paper bg-clay border-[1.5px] border-ink rounded-[3px] shadow-[2.5px_2.5px_0_var(--color-ink)] transition-transform motion-reduce:transition-none hover:-translate-x-px hover:-translate-y-px">
              <CrowsFoot size={24} strokeWidth={1.9} />
            </span>
            <span className="font-extrabold text-lg tracking-[0.13em] max-[720px]:hidden">
              CARDINAL
            </span>
          </Link>
          <nav className="flex items-center gap-[9px] min-w-0" aria-label="Breadcrumb">
            <span className="text-ink/22 text-[17px]">/</span>
            <Link href="/design" className="font-mono text-[13px] text-ink hover:underline">Designs</Link>
            <div className="w-44 min-w-0">
              <Input aria-label="Design name" maxLength={128} value={designName} onChange={(event) => setDesignName(event.target.value)} />
            </div>
          </nav>
        </div>

        <DesignToolbar
          zoom={view.k}
          onZoomIn={() => zoomBy(1.15)}
          onZoomOut={() => zoomBy(1 / 1.15)}
          onFit={() => fit()}
          onSave={saveToBackend}
          saving={saveMutation.isPending || redirecting}
          onExport={() => downloadJson(tables, edges)}
          onAddTable={addTable}
        />
      </header>

      <div className="relative flex flex-1 min-h-0">
        {sidebarPinned && (
          <DesignSidebar
            tables={renderTables}
            edges={edges}
            selection={selection}
            query={query}
            onQuery={setQuery}
            onPick={focusTable}
            onDeleteEdge={deleteSelectedEdge}
            headerAction={
              <IconButton
                onClick={() => setSidebarPinned(false)}
                aria-label="Collapse sidebar"
                title="Collapse"
              >
                <PanelLeftClose size={15} />
              </IconButton>
            }
          />
        )}

        {!sidebarPinned && (
          <div
            className="absolute left-0 top-0 bottom-0 z-20 w-9"
            onMouseEnter={() => setSidebarPeek(true)}
            onMouseLeave={() => setSidebarPeek(false)}
          >
            <button
              className="absolute left-1.5 top-4 z-10 grid place-items-center w-7 h-9 bg-paper border-[1.5px] border-ink rounded-[2px] shadow-[2px_2px_0_var(--color-ink)] hover:bg-taupe cursor-pointer"
              onClick={() => {
                setSidebarPinned(true);
                setSidebarPeek(false);
              }}
              aria-label="Show tables"
              aria-expanded={sidebarPeek}
            >
              <PanelLeftOpen size={15} />
            </button>

            <div
              className={
                "absolute left-0 top-0 h-full transition-transform duration-200 motion-reduce:transition-none shadow-[6px_0_0_rgb(74_73_71/0.14)] " +
                (sidebarPeek ? "translate-x-0" : "-translate-x-full pointer-events-none")
              }
            >
              <DesignSidebar
                tables={renderTables}
                edges={edges}
                selection={selection}
                query={query}
                onQuery={setQuery}
                onPick={focusTable}
                onDeleteEdge={deleteSelectedEdge}
                headerAction={
                  <IconButton
                    onClick={() => {
                      setSidebarPinned(true);
                      setSidebarPeek(false);
                    }}
                    aria-label="Pin sidebar"
                    title="Pin"
                  >
                    <Pin size={14} />
                  </IconButton>
                }
              />
            </div>
          </div>
        )}

        {/* canvas */}
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-paper bg-[radial-gradient(rgb(74_73_71/0.08)_1px,transparent_1.4px)] [background-size:24px_24px]"
          onMouseDown={startPan}
        >
          <div
            className="absolute top-0 left-0 origin-top-left will-change-transform"
            style={{
              transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.k})`,
              transition: animate && !reduce ? "transform .34s cubic-bezier(.2,.8,.2,1)" : "none",
            }}
          >
            <svg
              className="absolute top-0 left-0 overflow-visible pointer-events-none"
              width="2600"
              height="1400"
              aria-hidden="true"
            >
              {edges.map((ed) => {
                const edgeSelected = selection?.kind === "edge" && selection.id === ed.id;
                const touch =
                  ed.from.table === selectedTableId || ed.to.table === selectedTableId;
                const state = edgeSelected
                  ? "active"
                  : selection === null
                    ? "idle"
                    : touch
                      ? "active"
                      : selectedTableId
                        ? "dim"
                        : "idle";
                return (
                  <ErdEdge
                    key={ed.id}
                    edge={ed}
                    byId={byId}
                    state={state}
                    onClick={() => setSelection({ kind: "edge", id: ed.id })}
                    edgeSelected={edgeSelected}
                    onDelete={() => deleteEdge(ed.id)}
                  />
                );
              })}
              {connectFrom && connectSourceTable && connectCursor && (
                <path
                  d={(() => {
                    const rowIdx = connectSourceTable.columns.findIndex(
                      (c) => c.name === connectFrom.col,
                    );
                    const sy = connectSourceTable.y + 37 + (rowIdx + 0.5) * 27;
                    const sx =
                      connectCursor.x >= connectSourceTable.x + BOX_W / 2
                        ? connectSourceTable.x + BOX_W
                        : connectSourceTable.x;
                    return `M ${sx} ${sy} L ${connectCursor.x} ${connectCursor.y}`;
                  })()}
                  fill="none"
                  className="stroke-clay [stroke-width:1.5] [stroke-dasharray:4_3]"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            {renderTables.map((t) => {
              const dimmed = !!selectedTableId && !related.has(t.id) && selectedTableId !== t.id;
              return (
                <ErdNode
                  key={t.id}
                  table={t}
                  selected={selectedTableId === t.id}
                  dimmed={dimmed}
                  activeCols={activeCols[t.id]}
                  onNodeDown={(e) => {
                    e.stopPropagation();
                    setSelection({ kind: "table", id: t.id });
                  }}
                  onHeadDown={(e) => startEntityDrag(e, t)}
                  onConnectStart={(e, columnName) => startConnect(e, t.id, columnName)}
                  headerSlot={
                    <TableActionsMenu
                      onOpen={() => setSelection({ kind: "table", id: t.id })}
                      onEdit={() => {
                        setSelection({ kind: "table", id: t.id });
                        setEditing(true);
                      }}
                      onDelete={() => {
                        setSelection({ kind: "table", id: t.id });
                        setConfirmingDelete(true);
                      }}
                    />
                  }
                />
              );
            })}
          </div>

          <ErdLegend />
        </div>
      </div>

      {editingTable && (
        <TableEditorDialog
          table={editingTable}
          creating={pendingTable !== null}
          onClose={() => {
            setPendingTable(null);
            setEditing(false);
          }}
          onSave={saveTable}
        />
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title={`Remove ${deleteTargetName}?`}
          body={
            relCount > 0
              ? `This also removes ${relCount} relationship${relCount === 1 ? "" : "s"} attached to it.`
              : "This table has no relationships attached."
          }
          confirmLabel="Remove"
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={deleteTable}
        />
      )}
    </div>
  );
}
