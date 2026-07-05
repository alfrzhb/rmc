export function emptyToUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function stringValue(value: FormDataEntryValue | null) {
  return emptyToUndefined(value) ?? "";
}

export function numberValue(value: FormDataEntryValue | null) {
  const text = emptyToUndefined(value);

  if (!text) {
    return undefined;
  }

  return Number(text);
}

export function todayString() {
  return new Date().toISOString().slice(0, 10);
}
