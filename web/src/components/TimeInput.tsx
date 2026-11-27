import * as React from "react";
import { Input } from "@/components/ui/input";
import { normalizeTime } from "@/lib/time";

/**
 * A 24-hour time field ("09:30") that reads the same on every computer. The browser's
 * <input type="time"> follows the computer's locale, so a US setting shows 9:30 AM.
 * Typing "930" or "9" tidies to "09:30" / "09:00" when the field loses focus.
 *
 * With react-hook-form, register it with `setValueAs: normalizeTime` so the form
 * checks the tidied value too.
 */
export function TimeInput({
  className,
  onBlur,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="09:00"
      maxLength={5}
      className={className}
      onBlur={(e) => {
        e.target.value = normalizeTime(e.target.value);
        onBlur?.(e);
      }}
      {...props}
    />
  );
}
