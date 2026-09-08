import { CardinalErd } from "@/features/erd";

export default async function ErdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CardinalErd connectionId={Number(id)} />;
}
