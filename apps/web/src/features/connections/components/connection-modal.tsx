"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { Overlay, DialogPanel, Field, Input, Button, IconButton, Spinner } from "@/components/ui";
import { LABEL_CLASS } from "@/components/ui/input";
import { CrowsFoot } from "@/components/crows-foot";
import { introspectSchemas } from "../api/connections.service";
import type { Draft, Engine } from "../api/types";

type TestState = { state: "idle" | "testing" | "ok" | "fail"; msg: string };

const DEFAULT_PORT: Record<Engine, string> = {
  postgresql: "5432",
  mysql: "3306",
};

export function ConnectionModal({
  mode,
  initial,
  saving,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initial: Draft;
  saving?: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [test, setTest] = useState<TestState>({ state: "idle", msg: "" });
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
  }, []);

  const set = (k: keyof Draft, v: string) => {
    setDraft((d) => {
      const next = { ...d, [k]: v };
      if (k === "engine") {
        // fill the standard port if it's empty or still the other engine's default
        if (!d.port || d.port === DEFAULT_PORT[d.engine])
          next.port = DEFAULT_PORT[v as Engine];
      }
      return next;
    });
    setTest({ state: "idle", msg: "" });
    if (errors[k]) setErrors((e) => ({ ...e, [k]: false }));
  };

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!draft.name.trim()) e.name = true;
    if (!draft.host.trim()) e.host = true;
    if (!draft.database.trim()) e.database = true;
    if (!draft.user.trim()) e.user = true;
    if (!draft.port.trim()) e.port = true;
    if (mode === "create" && !draft.password) e.password = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const runTest = async () => {
    if (
      !draft.host.trim() ||
      !draft.port.trim() ||
      !draft.user.trim() ||
      !draft.password ||
      !draft.database.trim()
    ) {
      setTest({
        state: "fail",
        msg: "Fill in host, port, user, password and database to test.",
      });
      return;
    }
    setTest({ state: "testing", msg: "" });
    // ponytail: no AbortController — if the modal closes mid-test the ignored
    // setState is harmless (React 19 doesn't warn).
    try {
      const schemas = await introspectSchemas({
        ip_address: draft.host.trim(),
        port: draft.port.trim(),
        username: draft.user.trim(),
        password: draft.password,
        database_name: draft.database.trim(),
      });
      setTest({
        state: "ok",
        msg: `Reached ${draft.host} — ${schemas.length} schema${schemas.length === 1 ? "" : "s"}.`,
      });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setTest({
        state: "fail",
        msg:
          raw && raw !== "Internal server error"
            ? raw
            : "Couldn't connect — check host, port and credentials.",
      });
    }
  };

  const submit = () => {
    if (!validate()) return;
    onSave(draft);
  };

  const testTone =
    test.state === "ok"
      ? "text-[#4d6b3f] border-[rgb(77_107_63/0.4)] bg-[rgb(77_107_63/0.08)]"
      : test.state === "fail"
        ? "text-clay border-[rgb(177_116_87/0.4)] bg-clay/[0.14]"
        : "text-ink/55";

  return (
    <Overlay onDismiss={onClose}>
      <DialogPanel
        className="max-w-[468px]"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "create" ? "New connection" : "Edit connection"}
      >
        <div className="flex items-center justify-between px-4 py-[15px] border-b-[1.5px] border-ink bg-taupe">
          <div className="flex items-center gap-[9px] font-bold text-base text-ink">
            <CrowsFoot size={18} strokeWidth={2} />
            {mode === "create" ? "New connection" : "Edit connection"}
          </div>
          <IconButton onClick={onClose} aria-label="Close">
            <X size={18} />
          </IconButton>
        </div>

        <div className="pt-[18px] px-[18px] pb-1.5 flex flex-col gap-[14px]">
          <Field
            label="Connection name"
            error={errors.name}
            hint="How it shows up in your list"
          >
            <Input
              ref={firstField}
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="prod-core"
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Engine</span>
            <div
              className="inline-flex border-[1.5px] border-ink rounded-[2px] overflow-hidden w-fit"
              role="radiogroup"
              aria-label="Database engine"
            >
              {(["postgresql", "mysql"] as Engine[]).map((eng) => (
                <button
                  key={eng}
                  role="radio"
                  aria-checked={draft.engine === eng}
                  className={
                    "font-mono text-[12.5px] px-4 py-2 border-r-[1.5px] border-ink last:border-r-0 cursor-pointer " +
                    (draft.engine === eng
                      ? "bg-clay text-paper font-semibold"
                      : "bg-paper text-ink/55")
                  }
                  onClick={() => set("engine", eng)}
                >
                  {eng === "postgresql" ? "PostgreSQL" : "MySQL"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 max-[560px]:flex-col">
            <Field label="Host" error={errors.host} grow>
              <Input
                value={draft.host}
                onChange={(e) => set("host", e.target.value)}
                placeholder="10.0.4.12"
              />
            </Field>
            <Field label="Port" error={errors.port}>
              <Input
                className="w-[88px] max-[560px]:w-full"
                value={draft.port}
                onChange={(e) => set("port", e.target.value)}
                placeholder={DEFAULT_PORT[draft.engine]}
              />
            </Field>
          </div>

          <Field label="Database" error={errors.database}>
            <Input
              value={draft.database}
              onChange={(e) => set("database", e.target.value)}
              placeholder="core"
            />
          </Field>

          <div className="flex gap-3 max-[560px]:flex-col">
            <Field label="User" error={errors.user} grow>
              <Input
                value={draft.user}
                onChange={(e) => set("user", e.target.value)}
                placeholder="cardinal_ro"
              />
            </Field>
            <Field
              label="Password"
              error={errors.password}
              hint={
                mode === "edit"
                  ? "Leave blank to keep the current one"
                  : undefined
              }
              grow
            >
              <Input
                type="password"
                value={draft.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>

          {test.state !== "idle" && (
            <div
              className={
                "flex items-center gap-[7px] font-mono text-xs px-[11px] py-[9px] rounded-[2px] border border-ink/22 " +
                testTone
              }
            >
              {test.state === "testing" && (
                <>
                  <Spinner /> Testing connection…
                </>
              )}
              {test.state === "ok" && (
                <>
                  <Check size={15} strokeWidth={2.4} /> {test.msg}
                </>
              )}
              {test.state === "fail" && (
                <>
                  <AlertCircle size={15} strokeWidth={2.2} /> {test.msg}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-[10px] px-[18px] py-4 mt-2 border-t border-ink/14">
          <Button
            variant="ghost"
            onClick={() => void runTest()}
            disabled={test.state === "testing"}
          >
            Test connection
          </Button>
          <div className="flex gap-2">
            <Button variant="quiet" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {saving
                ? "Saving…"
                : mode === "create"
                  ? "Save connection"
                  : "Save changes"}
            </Button>
          </div>
        </div>
      </DialogPanel>
    </Overlay>
  );
}
