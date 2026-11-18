// Minimal Web Speech API types (Chrome/Safari). Mic buttons only render where the API exists (rule 8).
export interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
export interface Recognizer {
  lang: string;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e?: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
}
export type RecognizerCtor = new () => Recognizer;

export const speechCtor = (): RecognizerCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};
