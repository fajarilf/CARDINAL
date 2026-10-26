import { notFound } from "next/navigation";
import { DesignWorkspace } from "@/features/erd-design";

export default async function SavedDesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const designId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(designId) || designId < 1) notFound();
  return <DesignWorkspace designId={designId} />;
}
