declare module "@met4citizen/talkinghead/modules/talkinghead.mjs" {
  export class TalkingHead {
    constructor(node: HTMLElement, options?: Record<string, unknown>);

    showAvatar(
      avatar: Record<string, unknown>,
      onprogress?: ((ev: ProgressEvent) => void) | null,
    ): Promise<void>;

    start(): void;
    stop(): void;
    dispose(): void;

    streamStart(
      opt?: Record<string, unknown>,
      onAudioStart?: (() => void) | null,
      onAudioEnd?: (() => void) | null,
      onSubtitles?: ((text: string) => void) | null,
      onMetrics?: ((data: unknown) => void) | null,
    ): Promise<void>;

    streamAudio(r: {
      audio?: ArrayBuffer | Int16Array | Uint8Array | Float32Array;
      visemes?: string[];
      vtimes?: number[];
      vdurations?: number[];
      words?: string[];
      wtimes?: number[];
      wdurations?: number[];
    }): void;

    streamNotifyEnd(): void;
    streamInterrupt(): void;
    streamStop(): void;

    lipsyncPreProcessText(text: string, lang: string): string;
    lipsyncWordsToVisemes(
      text: string,
      lang: string,
    ): { visemes: string[]; times: number[]; durations: number[] } | null;

    playGesture(name: string, dur?: number, mirror?: boolean, ms?: number): void;
    stopGesture(ms?: number): void;
    lookAtCamera(ms: number): void;
    lookAhead(ms: number): void;
    setMood(mood: string): void;
    stopSpeaking(): void;
  }
}
