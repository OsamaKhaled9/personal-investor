export const runtime = "nodejs";

const BASE = "https://api.alquran.cloud/v1";

type RawAyah = {
  number: number;
  text: string;
  surah: { number: number; name: string; englishName: string };
  numberInSurah: number;
};

// GET /api/quran/page?p={n}           → { ayahs: [...] }
// GET /api/quran/page?p={n}&tafseer=1 → { ayahs: [...], tafseer: [...] }
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("p") ?? "1";
  const page = Math.max(1, Math.min(604, Number(raw) || 1));
  const withTafseer = url.searchParams.get("tafseer") === "1";

  try {
    if (withTafseer) {
      const [textRes, tafseerRes] = await Promise.all([
        fetch(`${BASE}/page/${page}/quran-uthmani`, { next: { revalidate: 86400 } }),
        fetch(`${BASE}/page/${page}/ar.muyassar`, { next: { revalidate: 86400 } }),
      ]);

      if (!textRes.ok || !tafseerRes.ok) {
        throw new Error(`AlQuran API error: ${textRes.status} / ${tafseerRes.status}`);
      }

      const [textJson, tafseerJson] = await Promise.all([textRes.json(), tafseerRes.json()]);

      const ayahs = (textJson.data.ayahs as RawAyah[]).map((a) => ({
        number: a.number,
        text: a.text,
        surahName: a.surah.englishName,
        surahNum: a.surah.number,
        numberInSurah: a.numberInSurah,
      }));

      const tafseer = (tafseerJson.data.ayahs as RawAyah[]).map((a) => ({
        number: a.number,
        text: a.text,
      }));

      return Response.json({ page, ayahs, tafseer });
    }

    const res = await fetch(`${BASE}/page/${page}/quran-uthmani`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`AlQuran API error: ${res.status}`);
    const json = await res.json();

    const ayahs = (json.data.ayahs as RawAyah[]).map((a) => ({
      number: a.number,
      text: a.text,
      surahName: a.surah.englishName,
      surahNum: a.surah.number,
      numberInSurah: a.numberInSurah,
    }));

    return Response.json({ page, ayahs });
  } catch (err) {
    console.error("[HAYATI:QURAN:PAGE]", String(err));
    return Response.json({ error: "Failed to fetch page" }, { status: 502 });
  }
}
