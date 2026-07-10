import type { TalkingHead } from "@met4citizen/talkinghead/modules/talkinghead.mjs";

export type WordLipsyncPayload = {
  words: string[];
  wtimes: number[];
  wdurations: number[];
};

const VOLUME_VISEMES = ["aa", "O", "E", "PP"] as const;

export async function waitForLipsyncReady(
  head: TalkingHead,
  lipsyncLang: string,
  timeoutMs = 8000,
): Promise<void> {
  try {
    await import(
      /* webpackIgnore: true */
      `/talkinghead/modules/lipsync-${lipsyncLang}.mjs`
    );
  } catch {
    // fall back to bundled dynamic import inside TalkingHead
  }

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const sample = head.lipsyncWordsToVisemes("hello", lipsyncLang);
      if (sample?.visemes?.length) return;
    } catch {
      // lipsync module still loading
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error("Lipsync module failed to load");
}

export function estimateUtteranceDurationMs(
  text: string,
  speakingForMs: number,
): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const fromWords = Math.max(3500, words * 480);
  const fromSpeech = Math.max(3000, speakingForMs + 2500);
  return Math.max(fromWords, fromSpeech);
}

export function buildWordTimedLipsync(
  text: string,
  durationMs: number,
): WordLipsyncPayload | null {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;

  const perWord = Math.max(220, durationMs / words.length);
  const wtimes: number[] = [];
  const wdurations: number[] = [];

  let cursor = 0;
  for (const word of words) {
    wtimes.push(cursor);
    wdurations.push(perWord);
    cursor += perWord;
  }

  return { words, wtimes, wdurations };
}

export function applyVolumeLipsync(
  head: TalkingHead,
  volume: number,
  clockMs: number,
  intensity = 1,
) {
  const level = Math.min(1, Math.max(0, volume * intensity));
  if (level < 0.015) return;

  const jaw = 0.1 + level * 0.75;
  head.setValue("jawOpen", jaw, 70);

  const visemeIndex =
    Math.floor(clockMs / 130) % VOLUME_VISEMES.length;
  const active = VOLUME_VISEMES[visemeIndex];
  const mouth = 0.2 + level * 0.7;

  for (const viseme of VOLUME_VISEMES) {
    head.setValue(
      `viseme_${viseme}`,
      viseme === active ? mouth : 0,
      70,
    );
  }
}

export function resetMouth(head: TalkingHead) {
  head.setValue("jawOpen", 0, 120);
  for (const viseme of VOLUME_VISEMES) {
    head.setValue(`viseme_${viseme}`, 0, 120);
  }
}
