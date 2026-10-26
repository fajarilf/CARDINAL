"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Spinner } from "@/components/ui";
import { useToast } from "@/components/toast-provider";
import { useDesign } from "../api/use-designs";
import type { SavedDesign } from "../api/types";
import { loadDesign, matchesSavedDesign, removeDesignDraft, type StoredDesign } from "../utils/storage";
import CardinalErdDesign from "./cardinal-erd-design";

export function DesignWorkspace({ designId }: { designId?: number }) {
  const { data, isPending, isFetching, error, refetch } = useDesign(designId);
  const [opened, setOpened] = useState<SavedDesign | null>(null);
  if (designId === undefined) return <DraftLoader key="new" />;
  if (opened?.id === designId) return <DraftLoader key={designId} saved={opened} />;
  if (isPending || isFetching) {
    return <div className="min-h-screen bg-paper text-ink p-8 flex items-center justify-center gap-2"><Spinner /> Loading design…</div>;
  }
  if (!data || error) {
    return <div role="alert" className="min-h-screen bg-paper text-ink p-8">
      <p>{error?.message ?? "Design not found."}</p>
      <Button variant="ghost" onClick={() => void refetch()}>Retry</Button>
      <Link href="/design" className="underline ml-4">Back to designs</Link>
    </div>;
  }
  if (opened?.id !== designId) setOpened(data);
  return <DraftLoader key={designId} saved={data} />;
}

function DraftLoader({ saved }: { saved?: SavedDesign }) {
  const [initialSaved] = useState(saved);
  const [loaded, setLoaded] = useState<{ draft: StoredDesign | null } | null>(null);
  const [choice, setChoice] = useState<"saved" | "draft" | null>(null);
  const toast = useToast();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLoaded({ draft: loadDesign(initialSaved?.id) }));
    return () => cancelAnimationFrame(frame);
  }, [initialSaved?.id]);

  if (!loaded) return <div className="min-h-screen bg-paper text-ink p-8">Checking browser draft…</div>;
  const draft = loaded.draft;
  const differs = draft && initialSaved && !matchesSavedDesign(draft, initialSaved);
  if (differs && choice === null) {
    return <main className="min-h-screen bg-paper text-ink grid place-items-center p-6">
      <section className="max-w-lg border-[1.5px] border-ink rounded p-6 shadow-brutal">
        <h1 className="text-xl font-bold">Restore browser draft?</h1>
        <p className="text-sm text-ink/65 my-4">This browser has a different draft of {initialSaved.name}. Restore it to keep editing, or use the backend version and discard this browser draft.</p>
        {draft.revision !== undefined && draft.revision !== initialSaved.revision && <p className="text-sm text-clay mb-4">The backend has a newer revision. Restoring this draft will not overwrite it; export the draft before reopening the saved version.</p>}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setChoice("draft")}>Restore draft</Button>
          <Button variant="ghost" onClick={() => {
            try { removeDesignDraft(initialSaved.id); }
            catch { toast("Browser draft could not be removed. The backend version will still open."); }
            setChoice("saved");
          }}>Use backend version</Button>
        </div>
      </section>
    </main>;
  }
  const useDraft = draft && (!initialSaved || choice === "draft");
  return <CardinalErdDesign
    designId={initialSaved?.id}
    initialName={useDraft ? draft.name ?? "Untitled design" : initialSaved?.name ?? "Untitled design"}
    initialDocument={useDraft ? { tables: draft.tables, edges: draft.edges } : initialSaved?.document ?? { tables: [], edges: [] }}
    initialRevision={useDraft ? draft.revision ?? initialSaved?.revision ?? null : initialSaved?.revision ?? null}
  />;
}
