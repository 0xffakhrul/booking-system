import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "./api";

type KnownErrors<T extends FieldValues> = Partial<
  Record<string, { field?: Path<T>; message: string }>
>;

/**
 * Puts an API error onto a react-hook-form form.
 * - codes listed in `known` get your wording, on a field or on the whole form
 * - VALIDATION_FAILED puts each message next to its input
 * - anything else shows the server's message above the submit button (errors.root.server)
 */
export function setServerErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  known: KnownErrors<T> = {},
) {
  if (!(err instanceof ApiError)) {
    setError("root.server", { message: "Something went wrong. Try again." });
    return;
  }

  const match = known[err.code];
  if (match) {
    setError(match.field ?? "root.server", { message: match.message });
    return;
  }

  if (err.code === "VALIDATION_FAILED" && err.fields) {
    for (const [name, messages] of Object.entries(err.fields)) {
      setError(name as Path<T>, { message: messages[0] });
    }
    return;
  }

  setError("root.server", { message: err.message });
}
