const BASE = "https://api.aladhan.com/v1";

export type PrayerTimes = {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

export async function getPrayerTimes(
  city = "Cairo",
  country = "Egypt",
  method = 5 // Egyptian General Authority of Survey
): Promise<PrayerTimes> {
  const url = `${BASE}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
  const res = await fetch(url, { next: { revalidate: 43200 } });
  if (!res.ok) throw new Error(`Aladhan API failed: ${res.status}`);
  const data = await res.json();
  const t = data.data.timings;
  // Strip timezone suffix: "04:23 (+02)" → "04:23"
  const clean = (s: string) => s.split(" ")[0];
  return {
    Fajr: clean(t.Fajr),
    Dhuhr: clean(t.Dhuhr),
    Asr: clean(t.Asr),
    Maghrib: clean(t.Maghrib),
    Isha: clean(t.Isha),
  };
}
