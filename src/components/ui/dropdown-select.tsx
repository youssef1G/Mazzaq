"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

export type DropdownOption = {
  value: string;
  label: string;
};

type Tone = "red" | "green" | "amber" | "blue" | "muted";

/**
 * The one dropdown used across the store and the back office.
 *
 * It renders a styled trigger, a shared menu surface and a hidden input so
 * plain server-action forms keep working without a native select.
 */
export function DropdownSelect({
  id,
  name,
  options,
  defaultValue,
  value: controlledValue,
  onValueChange,
  label,
  compact = false,
  submitOnChange = false,
  tone,
  className,
  disabled = false,
}: {
  id?: string;
  name?: string;
  options: DropdownOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  compact?: boolean;
  submitOnChange?: boolean;
  tone?: Tone;
  className?: string;
  disabled?: boolean;
}) {
  const locale = useLocale();
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? options[0]?.value ?? "",
  );
  const value = controlledValue ?? internalValue;
  const selected =
    options.find((option) => option.value === value) ?? options[0];
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hiddenRef.current) hiddenRef.current.value = value;
  }, [value]);

  function select(next: string) {
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
    if (hiddenRef.current) {
      hiddenRef.current.value = next;
      if (submitOnChange) hiddenRef.current.form?.requestSubmit();
    }
  }

  return (
    <div
      className={className ? `dropdown-select ${className}` : "dropdown-select"}
    >
      <DropdownMenu.Root dir={locale === "ar" ? "rtl" : "ltr"}>
        <DropdownMenu.Trigger asChild disabled={disabled}>
          <button
            id={triggerId}
            type="button"
            className="dropdown-trigger"
            data-compact={compact || undefined}
            data-tone={tone}
            aria-label={
              label ? `${label}: ${selected?.label ?? ""}` : undefined
            }
          >
            <span>{selected?.label}</span>
            <ChevronDown size={14} strokeWidth={1.7} aria-hidden />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="menu-surface dropdown-menu"
            align="start"
            sideOffset={6}
            collisionPadding={10}
          >
            <DropdownMenu.RadioGroup value={value} onValueChange={select}>
              {options.map((option) => (
                <DropdownMenu.RadioItem
                  key={option.value}
                  value={option.value}
                  className="dropdown-item"
                >
                  <span>{option.label}</span>
                  <DropdownMenu.ItemIndicator className="dropdown-indicator">
                    <Check size={13} strokeWidth={2} aria-hidden />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {name ? (
        <input ref={hiddenRef} type="hidden" name={name} defaultValue={value} />
      ) : null}
    </div>
  );
}
