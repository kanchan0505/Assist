/** Returns false for URLs Vapi's cloud servers cannot reach (localhost, LAN IPs). */
export function isPubliclyReachableUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return false;

    const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
    if (localHosts.has(hostname)) return false;

    if (/^10\./.test(hostname)) return false;
    if (/^192\.168\./.test(hostname)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}

export function resolveCustomLlmUrl(appUrl?: string | null): string | null {
  const base = appUrl?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/api/voice/chat/completions`;
}

export function canUseCustomLlm(appUrl?: string | null): boolean {
  if (!appUrl) return false;
  return isPubliclyReachableUrl(appUrl);
}

export type VapiLlmMode = "custom" | "groq" | "dashboard";

export function resolveServerLlmMode(
  appUrl: string | null,
  useGroqOverride: boolean,
): VapiLlmMode {
  if (appUrl && canUseCustomLlm(appUrl) && resolveCustomLlmUrl(appUrl)) {
    return "custom";
  }
  if (useGroqOverride) return "groq";
  return "dashboard";
}
