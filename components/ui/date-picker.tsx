"use client";

import * as React from "react";
import { Popover } from "@base-ui/react/popover";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseISO(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
function formatDisplay(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * A lightweight, dependency-free date picker: a styled trigger + a popover month
 * grid. Replaces the native <input type="date"> (which renders a laggy browser
 * calendar). Submits its value through a hidden input named `name`.
 */
export function DatePicker({
  id,
  name,
  defaultValue = "",
  required,
  placeholder = "Select date",
  className,
  max,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  /** Latest selectable date (YYYY-MM-DD); later dates are disabled. */
  max?: string;
}) {
  const [value, setValue] = React.useState(defaultValue);
  const selected = parseISO(value);
  const maxDate = max ? parseISO(max) : null;
  const [open, setOpen] = React.useState(false);
  // Start the view where dates are actually selectable (e.g. 18 years ago).
  const [view, setView] = React.useState(() => selected ?? maxDate ?? new Date());
  const today = new Date();
  const todayDisabled = maxDate ? today > maxDate : false;

  const year = view.getFullYear();
  const month = view.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function pick(day: number) {
    const d = new Date(year, month, day);
    setValue(toISO(d));
    setOpen(false);
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          id={id}
          data-empty={!selected}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30",
            className,
          )}
        >
          <CalendarIcon className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className={cn("flex-1 text-left", !selected && "text-muted-foreground")}>
            {selected ? formatDisplay(selected) : placeholder}
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
            <Popover.Popup className="w-64 origin-(--transform-origin) rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              {/* Month header */}
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setView(new Date(year, month - 1, 1))}
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-sm font-medium text-foreground">
                  {MONTHS[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={() => setView(new Date(year, month + 1, 1))}
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Weekday labels */}
              <div className="grid grid-cols-7 gap-0.5">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="flex h-7 items-center justify-center text-[10px] font-medium text-muted-foreground">
                    {w}
                  </div>
                ))}
                {cells.map((day, i) => {
                  if (day === null) return <div key={`e${i}`} className="size-8" />;
                  const cellDate = new Date(year, month, day);
                  const isSelected = selected && sameDay(cellDate, selected);
                  const isToday = sameDay(cellDate, today);
                  const disabled = maxDate ? cellDate > maxDate : false;
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => pick(day)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md text-xs transition-colors",
                        disabled
                          ? "cursor-not-allowed text-muted-foreground/30"
                          : isSelected
                            ? "bg-brand font-medium text-brand-foreground"
                            : "text-foreground hover:bg-accent",
                        !disabled && !isSelected && isToday && "font-semibold text-brand ring-1 ring-inset ring-brand/40",
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                {todayDisabled ? (
                  <span />
                ) : (
                  <button
                    type="button"
                    onClick={() => { setValue(toISO(today)); setView(today); setOpen(false); }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-accent"
                  >
                    Today
                  </button>
                )}
                {selected && !required && (
                  <button
                    type="button"
                    onClick={() => { setValue(""); setOpen(false); }}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
