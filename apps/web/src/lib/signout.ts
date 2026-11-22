// What this browser tab keeps for a signed-in session, forgotten on every sign-out (docs/31 §H, L7): on a shared
// device the next person must not find her assistant chat or the share links she made. The tour step and the "API is
// awake" flag hold nothing about her and stay.
const SESSION_KEYS = [/^rs_chat_/, /^rs_share_tokens$/];

export function forgetThisTab(storage: Pick<Storage, "length" | "key" | "removeItem"> | undefined = globalThis.sessionStorage): void {
  if (!storage) return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && SESSION_KEYS.some((re) => re.test(k))) doomed.push(k);
    }
    for (const k of doomed) storage.removeItem(k);
  } catch {
    /* storage blocked (private mode): nothing was kept */
  }
}
