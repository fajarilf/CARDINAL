"use client";

import { useState, useRef, useEffect } from "react";
import { KeyRound, Plus, Trash2, X } from "lucide-react";
import { Overlay, DialogPanel, Field, Input, Button, IconButton } from "@/components/ui";
import type { ErdColumn, ErdTable } from "../api/types";
import { DataTypeSelect } from "./data-type-select";

export function TableEditorDialog({
  table,
  creating = false,
  onClose,
  onSave,
}: {
  table: ErdTable;
  creating?: boolean;
  onClose: () => void;
  onSave: (name: string, columns: ErdColumn[]) => void;
}) {
  const [name, setName] = useState(table.name);
  const [columns, setColumns] = useState<ErdColumn[]>(table.columns);
  const [nameError, setNameError] = useState(false);
  const [rowErrors, setRowErrors] = useState<Set<number>>(new Set());
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
  }, []);

  const setColumn = (i: number, patch: Partial<ErdColumn>) => {
    setColumns((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
    setRowErrors((e) => {
      if (!e.has(i)) return e;
      const next = new Set(e);
      next.delete(i);
      return next;
    });
  };

  const addColumn = () =>
    setColumns((cs) => [...cs, { name: "", type: "text" }]);

  const removeColumn = (i: number) =>
    setColumns((cs) => cs.filter((_, j) => j !== i));

  const validate = () => {
    const trimmedName = name.trim();
    const badRows = new Set<number>();
    columns.forEach((c, i) => {
      if (!c.name.trim()) badRows.add(i);
    });
    setNameError(!trimmedName);
    setRowErrors(badRows);
    return !!trimmedName && badRows.size === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave(
      name.trim(),
      columns.map((c) => ({
        ...c,
        name: c.name.trim(),
        type: c.type.trim() || "text",
      })),
    );
  };

  return (
    <Overlay onDismiss={onClose}>
      <DialogPanel
        className="max-w-[440px]"
        role="dialog"
        aria-modal="true"
        aria-label={creating ? "Add table" : "Edit table"}
      >
        <div className="flex items-center justify-between px-4 py-[15px] border-b-[1.5px] border-ink bg-taupe">
          <div className="font-bold text-base text-ink">{creating ? "Add table" : "Edit table"}</div>
          <IconButton onClick={onClose} aria-label="Close">
            <X size={18} />
          </IconButton>
        </div>

        <div className="pt-[18px] px-[18px] pb-1.5 flex flex-col gap-[14px] max-h-[60vh] overflow-y-auto">
          <Field label="Table name" error={nameError}>
            <Input
              ref={firstField}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(false);
              }}
              placeholder="users"
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-ink/55 tracking-[0.03em]">
              Columns
              {rowErrors.size > 0 && (
                <span className="text-clay"> — name required</span>
              )}
            </span>
            <div className="flex flex-col gap-2">
              {columns.map((c, i) => (
                <div key={i} className="grid grid-cols-[31px_minmax(0,2fr)_minmax(0,1fr)_auto] items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setColumn(i, { pk: !c.pk })}
                    aria-pressed={!!c.pk}
                    aria-label={c.pk ? "Unset primary key" : "Set as primary key"}
                    title="Primary key"
                    className={
                      "shrink-0 grid place-items-center w-[31px] h-[31px] rounded-[2px] border-[1.5px] cursor-pointer transition-colors duration-100 " +
                      (c.pk
                        ? "bg-clay border-clay text-paper"
                        : "bg-paper border-ink/22 text-ink/40 hover:border-ink/40")
                    }
                  >
                    <KeyRound size={13} strokeWidth={2.2} />
                  </button>
                  <Input
                    value={c.name}
                    onChange={(e) => setColumn(i, { name: e.target.value })}
                    placeholder="column_name"
                    className={
                      "min-w-0" +
                      (rowErrors.has(i) ? " border-clay" : "")
                    }
                  />
                  <DataTypeSelect
                    value={c.type}
                    onChange={(type) => setColumn(i, { type })}
                    aria-label={`Datatype for ${c.name || "column"}`}
                  />
                  <IconButton
                    tone="danger"
                    onClick={() => removeColumn(i)}
                    aria-label={`Remove ${c.name || "column"}`}
                    title="Remove column"
                  >
                    <Trash2 size={14} strokeWidth={1.9} />
                  </IconButton>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="self-start" onClick={addColumn}>
              <Plus size={14} strokeWidth={2.2} /> Add column
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-[18px] py-4 mt-2 border-t border-ink/14">
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{creating ? "Create table" : "Save"}</Button>
        </div>
      </DialogPanel>
    </Overlay>
  );
}
