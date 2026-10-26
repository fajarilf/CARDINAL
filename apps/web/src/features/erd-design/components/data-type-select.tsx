"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui";
import { getDataTypeOptions } from "../utils/data-types";

export function DataTypeSelect({
  value,
  onChange,
  "aria-label": label,
}: {
  value: string;
  onChange: (type: string) => void;
  "aria-label": string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<CSSProperties>({});
  const input = useRef<HTMLInputElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const listId = useId();
  const options = getDataTypeOptions(query, value);

  const openPicker = () => {
    const rect = input.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(Math.max(rect.width, 200), window.innerWidth - 16);
    const below = window.innerHeight - rect.bottom;
    setPosition({
      position: "fixed",
      width,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      ...(below >= 200
        ? { top: rect.bottom + 4, maxHeight: Math.min(240, below - 12) }
        : { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.min(240, rect.top - 12) }),
    });
    setQuery("");
    setActive(0);
    setOpen(true);
  };

  const select = (type: string) => {
    if (!getDataTypeOptions("", value).includes(type)) return;
    onChange(type);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && (input.current?.contains(target) || popup.current?.contains(target))) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      document.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [active, open, listId]);

  return (
    <div className="relative min-w-0">
      <Input
        ref={input}
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={open ? query : value}
        placeholder={open ? "Search types…" : "Select type"}
        className="min-w-0 pr-6"
        onFocus={openPicker}
        onClick={() => { if (!open) openPicker(); }}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          if (!open) openPicker();
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) openPicker();
            else setActive((index) => Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))));
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (!open) openPicker();
            else if (options[active]) select(options[active]);
          } else if (event.key === "Tab") {
            setOpen(false);
          }
        }}
      />
      <ChevronDown size={12} aria-hidden="true" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-ink/55" />
      {open && createPortal(
        <div
          ref={popup}
          id={listId}
          role="listbox"
          aria-label={label}
          style={position}
          className="z-50 overflow-y-auto bg-paper border-[1.5px] border-ink rounded-[2px] shadow-brutal py-1"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {options.length === 0 ? (
            <div role="status" className="px-3 py-2 font-mono text-xs text-ink/55">No matching types</div>
          ) : options.map((type, index) => (
            <button
              key={type}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={type === value}
              tabIndex={-1}
              className={`flex items-center justify-between gap-2 w-full px-3 py-2 text-left font-mono text-xs text-ink cursor-pointer ${index === active ? "bg-taupe" : "hover:bg-taupe/60"}`}
              onClick={() => select(type)}
            >
              <span>{type}</span>
              {type === value && <Check size={13} aria-hidden="true" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
