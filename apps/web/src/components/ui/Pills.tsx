"use client";

import type { ReactNode } from "react";

export interface Option<V extends string> {
  value: V;
  label: ReactNode;
}

/** .pills segmented switch (e.g. 3 / 6 / 12 months). One pressed at a time. */
export function Pills<V extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: ReadonlyArray<Option<V>>;
  value: V;
  onChange: (v: V) => void;
  label: string;
}) {
  return (
    <div className="pills" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** .seg chips: toggles (multi) or a single choice (single). */
export function Seg<V extends string>({
  options,
  selected,
  onToggle,
  label,
}: {
  options: ReadonlyArray<Option<V>>;
  selected: ReadonlyArray<V>;
  onToggle: (v: V) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={selected.includes(o.value)} onClick={() => onToggle(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
