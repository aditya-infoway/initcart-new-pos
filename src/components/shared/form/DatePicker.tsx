/**
 * DatePicker — themed wrapper around react-flatpickr.
 *
 * Visually matches the project's <Input> component (form-input styles,
 * border, focus ring, dark-mode tokens, error state).
 * The global datepicker.css already themes the calendar popup.
 *
 * Import (always use this path):
 *   import { DatePicker } from "@/components/shared/form/Datepicker";
 *
 * Controlled form usage:
 *   <DatePicker
 *     label="Date *"
 *     value={value}            // "YYYY-MM-DD" | Date | ""
 *     onChange={(str) => setValue("date", str)}
 *     error={errors.date?.message}
 *   />
 *
 * Raw flatpickr options usage:
 *   <DatePicker
 *     options={{ disable: [(d) => d.getDay() === 0], locale: { firstDayOfWeek: 1 } }}
 *     placeholder="Choose date..."
 *   />
 */

import Flatpickr from "react-flatpickr";
import type { DateTimePickerProps } from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { ReactNode, useRef } from "react";
import clsx from "clsx";

import { useId } from "@/hooks";
import { InputErrorMsg } from "@/components/ui/Form/InputErrorMsg";

// ── Types ──────────────────────────────────────────────────────────────────
export interface DatePickerProps {
  /** Label shown above the input */
  label?: ReactNode;
  /** Controlled value — ISO "YYYY-MM-DD", Date object, or "" */
  value?: string | Date | Date[] | null;
  /** Called with "YYYY-MM-DD" string on select, "" on clear */
  onChange?: (dateStr: string, dates?: Date[]) => void;
  /** Validation error message (string) or true for error border only */
  error?: ReactNode | boolean;
  /** Input placeholder */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Show × clear button (default true) */
  clearable?: boolean;
  /** Extra className on the input element */
  className?: string;
  /** Element id */
  id?: string;
  /** Raw flatpickr options — merged with defaults; caller wins on conflicts */
  options?: DateTimePickerProps["options"];
  /** Show time picker */
  enableTime?: boolean;
  /** Shorthand minDate */
  minDate?: string | Date;
  /** Shorthand maxDate */
  maxDate?: string | Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function toDateObj(
  v: string | Date | Date[] | null | undefined,
): Date | Date[] | undefined {
  if (!v) return undefined;
  if (Array.isArray(v)) return v;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

function toISODate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

// ── Component ──────────────────────────────────────────────────────────────
export function DatePicker({
  label,
  value,
  onChange,
  error,
  placeholder = "DD-MM-YYYY",
  disabled,
  clearable = true,
  className,
  id,
  options,
  enableTime = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const inputId  = useId(id, "dp");
  const fpRef    = useRef<any>(null);
  const hasError = !!error;

  const handleChange = (dates: Date[]) => {
    if (!onChange) return;
    onChange(dates.length > 0 ? toISODate(dates[0]) : "", dates);
  };

  // Merge defaults with caller-supplied options (caller overrides)
  const resolvedOptions: DateTimePickerProps["options"] = {
    dateFormat:    "d-m-Y",   // display DD-MM-YYYY
    allowInput:    true,
    disableMobile: true,      // always use flatpickr, not native date input
    enableTime,
    ...(enableTime ? { time_24hr: true } : {}),
    ...(minDate ? { minDate } : {}),
    ...(maxDate ? { maxDate } : {}),
    ...options,               // caller fully overrides any key above
  };

  const showClear = clearable && !!value && !disabled;

  return (
    <div className="input-root flex flex-col">
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className="input-label">
          <span className="input-label">{label}</span>
        </label>
      )}

      {/* Wrapper */}
      <div className={clsx("input-wrapper relative", label && "mt-1.5")}>
        {/* Calendar icon — prefix */}
        <div
          className={clsx(
            "pointer-events-none absolute left-0 top-0 flex h-full w-9 items-center justify-center transition-colors",
            hasError
              ? "text-error dark:text-error-light"
              : "text-gray-400 dark:text-dark-300",
          )}
        >
          <CalendarDaysIcon className="size-4" />
        </div>

        <Flatpickr
          ref={fpRef}
          id={inputId}
          value={toDateObj(value) as any}
          onChange={handleChange}
          disabled={disabled}
          options={resolvedOptions}
          render={({ id: _id, value: _v, ...rest }, refFn) => (
            <input
              {...rest}
              ref={refFn}
              id={inputId}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
              className={clsx(
                "form-input-base form-input peer pl-9",
                showClear ? "pr-9" : "",
                hasError
                  ? "border-error dark:border-error-lighter"
                  : disabled
                    ? "cursor-not-allowed border-gray-300 bg-gray-150 opacity-60 dark:border-dark-500 dark:bg-dark-600"
                    : "border-gray-300 hover:border-gray-400 focus:border-primary-600 dark:border-dark-450 dark:hover:border-dark-400 dark:focus:border-primary-500",
                className,
              )}
            />
          )}
        />

        {/* Clear button */}
        {showClear && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              fpRef.current?.flatpickr?.clear();
              onChange?.("", []);
            }}
            className="absolute right-2 top-0 flex h-full items-center justify-center px-1 text-gray-400 transition-colors hover:text-error-600 dark:text-dark-400 dark:hover:text-error-400"
            aria-label="Clear date"
          >
            <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      <InputErrorMsg when={hasError && typeof error !== "boolean"}>
        {error}
      </InputErrorMsg>
    </div>
  );
}
