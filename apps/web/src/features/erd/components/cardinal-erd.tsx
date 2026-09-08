"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useConnection } from "@/features/connections";
import { Spinner } from "@/components/ui";
import { CrowsFoot } from "@/components/crows-foot";
import { useErdSchema } from "../api/use-erd";
import { toErdSchema } from "../api/to-erd";
import { ErdView } from "./erd-view";

const errText = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";

function ErdShell({
  children,
  error,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div className="h-screen flex flex-col text-ink font-sans bg-paper antialiased">
      <header className="flex items-center px-[18px] py-[11px] border-b-[1.5px] border-ink">
        <Link
          href="/"
          aria-label="Back to connections"
          title="Connections"
          className="flex items-center gap-2.5 rounded-[3px] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(177_116_87/0.14)]"
        >
          <span className="grid place-items-center w-[34px] h-[34px] text-paper bg-clay border-[1.5px] border-ink rounded-[3px] shadow-[2.5px_2.5px_0_var(--color-ink)] transition-transform motion-reduce:transition-none hover:-translate-x-px hover:-translate-y-px">
            <CrowsFoot size={24} strokeWidth={1.9} />
          </span>
          <span className="font-extrabold text-lg tracking-[0.13em]">CARDINAL</span>
        </Link>
      </header>
      <div
        className={
          "flex-1 grid place-items-center px-6 text-center font-mono text-[13px] " +
          (error ? "text-clay" : "text-ink/55")
        }
      >
        <p className="flex items-center gap-2 max-w-[52ch]">{children}</p>
      </div>
    </div>
  );
}

export default function CardinalErd({
  connectionId,
}: {
  connectionId: number;
}) {
  const schemaQ = useErdSchema(connectionId);
  const connQ = useConnection(connectionId);

  if (!Number.isFinite(connectionId)) {
    return <ErdShell error>Invalid connection id.</ErdShell>;
  }
  if (schemaQ.isPending) {
    return (
      <ErdShell>
        <Spinner /> Introspecting schema…
      </ErdShell>
    );
  }
  if (schemaQ.isError) {
    return <ErdShell error>{errText(schemaQ.error)}</ErdShell>;
  }

  const erd = toErdSchema(schemaQ.data);
  if (erd.tables.length === 0) {
    return <ErdShell>No tables found in &ldquo;{erd.schema}&rdquo;.</ErdShell>;
  }

  const connectionName = connQ.data?.name ?? erd.schema;
  const engine = connQ.data
    ? connQ.data.database === 0
      ? "mysql"
      : "postgresql"
    : undefined;

  return (
    <ErdView
      key={connectionId}
      schema={erd}
      connectionName={connectionName}
      engine={engine}
    />
  );
}
