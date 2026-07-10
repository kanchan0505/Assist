export function isNonFatalVapiError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const record = error as Record<string, unknown>;
  const type = typeof record.type === "string" ? record.type : "";

  let message = "";
  if (typeof record.message === "string") message = record.message;

  const nested = record.error;
  if (nested && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    if (typeof nestedRecord.message === "string") {
      message = `${message} ${nestedRecord.message}`;
    }
    if (typeof nestedRecord.name === "string") {
      message = `${message} ${nestedRecord.name}`;
    }
  }

  const combined = `${type} ${message}`.toLowerCase();

  if (type === "daily-error") {
    if (
      combined.includes("setsinkid") ||
      combined.includes("notallowederror") ||
      combined.includes("user gesture") ||
      combined.includes("play()") ||
      message.trim() === ""
    ) {
      return true;
    }
  }

  return false;
}

export function isFatalVapiError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const type = (error as Record<string, unknown>).type;
  if (typeof type !== "string") return false;

  return (
    type === "validation-error" ||
    type === "daily-call-join-error" ||
    type === "daily-call-object-creation-error"
  );
}

export function formatVapiError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Voice connection error";
  }

  const record = error as Record<string, unknown>;

  const nested = record.error;
  if (nested && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    if (typeof nestedRecord.message === "string" && nestedRecord.message) {
      return nestedRecord.message;
    }
  }

  if (typeof record.message === "string" && record.message) {
    return record.message;
  }

  if (typeof record.stage === "string") {
    const meta = record.metadata as Record<string, unknown> | undefined;
    if (meta && typeof meta.error === "string") {
      return `Connection ${record.stage}: ${meta.error}`;
    }
    return `Connection ${record.stage} failed`;
  }

  if (typeof record.type === "string") {
    return `Voice error (${record.type})`;
  }

  return "Voice connection error";
}
