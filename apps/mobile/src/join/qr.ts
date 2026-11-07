const CLINIC_ID = /^[A-Za-z0-9_-]{1,40}$/;

/**
 * The clinic id in a clinic's patient QR code (web PatientInvite): <site>/join?clinic=<id>, or the app's own link
 * reprosense://join?clinic=<id>. Anything else returns null. The id is only a hint: Join checks it against the
 * API's clinic list, and sharing with that clinic stays an unticked choice.
 */
export function clinicFromQr(data: string): string | null {
  const m = /^[a-z][a-z0-9+.-]*:\/\/(?:[^?#]*\/)?join\/?\?([^#]*)/i.exec(data.trim());
  if (!m) return null;
  for (const pair of (m[1] ?? "").split("&")) {
    const [key, value = ""] = pair.split("=");
    if (key !== "clinic") continue;
    try {
      const id = decodeURIComponent(value.replace(/\+/g, " "));
      return CLINIC_ID.test(id) ? id : null;
    } catch {
      return null;
    }
  }
  return null;
}
