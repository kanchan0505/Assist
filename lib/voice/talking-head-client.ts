import type { TalkingHead } from "@met4citizen/talkinghead/modules/talkinghead.mjs";
import { INTERVIEWER_AVATAR } from "@/lib/voice/avatar-config";
import { resolveLipsyncLang } from "@/lib/voice/talking-head-sync";
import { waitForLipsyncReady } from "@/lib/voice/lipsync-driver";

const TALKING_HEAD_MODULE = "/talkinghead/modules/talkinghead.mjs";
const WORKLET_PATH = "/talkinghead/playback-worklet.js";

export type TalkingHeadInstance = TalkingHead;

type TalkingHeadConstructor = new (
  node: HTMLElement,
  options?: Record<string, unknown>,
) => TalkingHead;

let talkingHeadClassPromise: Promise<TalkingHeadConstructor> | null = null;

async function loadTalkingHeadClass(): Promise<TalkingHeadConstructor> {
  if (!talkingHeadClassPromise) {
    talkingHeadClassPromise = import(
      /* webpackIgnore: true */
      TALKING_HEAD_MODULE
    )
      .then((module) => {
        if (!module.TalkingHead) {
          throw new Error("TalkingHead export missing from module");
        }
        return module.TalkingHead;
      })
      .catch((error) => {
        talkingHeadClassPromise = null;
        const message =
          error instanceof Error ? error.message : "Unknown module load error";
        throw new Error(`Failed to load TalkingHead module: ${message}`);
      });
  }

  return talkingHeadClassPromise;
}

export async function createTalkingHead(
  container: HTMLElement,
  interviewLanguage: string,
): Promise<TalkingHead> {
  const TalkingHead = await loadTalkingHeadClass();
  const lipsyncLang = resolveLipsyncLang(interviewLanguage);

  const head = new TalkingHead(container, {
    lipsyncModules: [lipsyncLang, "en"],
    lipsyncLang,
    cameraView: "upper",
    cameraDistance: 0.15,
    cameraRotateEnable: false,
    cameraZoomEnable: false,
    cameraPanEnable: false,
    avatarIdleEyeContact: 0.35,
    avatarIdleHeadMove: 0.6,
    mixerGainSpeech: 0,
    modelFPS: 30,
    lightSpotIntensity: 14,
    avatarMood: "neutral",
  });

  patchWorkletLoader(head);

  try {
    await waitForLipsyncReady(head, lipsyncLang);
    await head.showAvatar({
      url: INTERVIEWER_AVATAR.modelUrl,
      body: INTERVIEWER_AVATAR.body,
      avatarMood: "neutral",
      lipsyncLang,
    });
  } catch (error) {
    head.dispose();
    const message =
      error instanceof Error ? error.message : "Unknown avatar load error";
    throw new Error(`Failed to load 3D model: ${message}`);
  }

  head.start();
  return head;
}

export async function ensureTalkingHeadStream(
  head: TalkingHead,
  interviewLanguage: string,
): Promise<void> {
  const lipsyncLang = resolveLipsyncLang(interviewLanguage);
  const internal = head as unknown as { isStreaming?: boolean };
  if (internal.isStreaming) return;

  await head.streamStart({
    waitForAudioChunks: false,
    gain: 0,
    lipsyncType: "words",
    lipsyncLang,
    mood: "neutral",
  });
}

function patchWorkletLoader(head: TalkingHead) {
  const internal = head as unknown as {
    audioCtx: AudioContext;
  };

  const audioWorklet = internal.audioCtx.audioWorklet;
  const originalAddModule = audioWorklet.addModule.bind(audioWorklet);

  audioWorklet.addModule = (url: string | URL) => {
    const href = typeof url === "string" ? url : url.href;
    if (href.includes("playback-worklet")) {
      return originalAddModule(WORKLET_PATH);
    }
    return originalAddModule(url);
  };
}
