import { clinicFromQr } from "./qr";

test("reads the clinic from the web invite QR and from the app link", () => {
  expect(clinicFromQr("https://reprosense.vercel.app/join?clinic=clinic_corniche")).toBe("clinic_corniche");
  expect(clinicFromQr("reprosense://join?clinic=clinic_alain")).toBe("clinic_alain");
  expect(clinicFromQr("http://localhost:3000/join/?lang=ar&clinic=clinic_dhafra#top")).toBe("clinic_dhafra");
});

test("anything that is not a join link with a clinic id is refused", () => {
  expect(clinicFromQr("https://example.com/notjoin?clinic=clinic_corniche")).toBeNull();
  expect(clinicFromQr("https://reprosense.vercel.app/join")).toBeNull();
  expect(clinicFromQr("https://reprosense.vercel.app/join?clinic=")).toBeNull();
  expect(clinicFromQr("https://reprosense.vercel.app/join?clinic=%3Cscript%3E")).toBeNull();
  expect(clinicFromQr("clinic_corniche")).toBeNull();
  expect(clinicFromQr("WIFI:S:clinic;T:WPA;P:secret;;")).toBeNull();
});
