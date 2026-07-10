import Vapi from "@vapi-ai/web";

let vapiClient: Vapi | null = null;

export function getVapiPublicKey() {
  const key = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
  if (!key) {
    throw new Error("NEXT_PUBLIC_VAPI_WEB_TOKEN is not configured");
  }
  return key;
}

export function getVapiAssistantId() {
  const id = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  if (!id) {
    throw new Error("NEXT_PUBLIC_VAPI_ASSISTANT_ID is not configured");
  }
  return id;
}

export function getVapiClient() {
  if (!vapiClient) {
    vapiClient = new Vapi(getVapiPublicKey());
  }
  return vapiClient;
}

export function getCustomLlmUrl() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  return `${base}/api/voice/chat/completions`;
}

export function destroyVapiClient() {
  vapiClient = null;
}

export type VapiVariableValues = {
  username: string;
  interviewType: "skill" | "project";
  interviewLanguage: string;
  interviewContext: string;
  skillName?: string;
  projectTitle?: string;
  sessionId?: string;
  interviewGuidelines?: string;
};
