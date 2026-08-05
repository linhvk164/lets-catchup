"use client";

import type { ExceptionDate } from "@/lib/types";
import { parseException } from "@/lib/availability";
import { Button } from "@/components/ui";

export function ExceptionEditor({
  exceptions,
  onChange,
  input,
  onInputChange,
}: {
  exceptions: ExceptionDate[];
  onChange: (next: ExceptionDate[]) => void;
  input: string;
  onInputChange: (value: string) => void;
}) {
  function add() {
    const parsed = parseException(input);
    if (!parsed) return;
    onChange(
      exceptions.some((e) => e.date === parsed.date && e.type === parsed.type)
        ? exceptions
        : [...exceptions, parsed]
    );
    onInputChange("");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">Exceptions</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Enter exception…"
          className="min-w-0 flex-1 rounded-xl border border-ink/10 bg-white/70 px-4 py-3 text-base text-ink outline-none ring-ocean/30 placeholder:text-ink-soft/50 focus:border-ocean/40 focus:ring-2"
        />
        <Button type="button" variant="secondary" className="shrink-0 px-4" onClick={add}>
          + Add
        </Button>
      </div>
      <p className="text-xs text-ink-soft">
        Try &quot;Unavailable August 20&quot; or &quot;Free all day August 15&quot;
      </p>

      {exceptions.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {exceptions.map((ex) => (
            <li
              key={`${ex.date}-${ex.type}`}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1.5 text-sm text-ink"
            >
              <span className="max-w-[14rem] truncate">{ex.label}</span>
              <button
                type="button"
                aria-label={`Remove ${ex.label}`}
                className="text-ink-soft hover:text-stamp"
                onClick={() =>
                  onChange(
                    exceptions.filter(
                      (e) => !(e.date === ex.date && e.type === ex.type)
                    )
                  )
                }
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
