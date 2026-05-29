const BASE = "https://api.alquran.cloud/v1";

export type QuranAyah = {
  number: number;
  text: string;
  surah: { number: number; name: string; englishName: string };
  numberInSurah: number;
};

export type QuranPage = {
  pageNumber: number;
  ayahs: QuranAyah[];
};

export type RandomVerse = {
  ar: string;
  en: string;
  surahName: string;
  surahNameAr: string;
  ayahNum: number;
  surahNum: number;
};

export async function getQuranPage(page: number): Promise<QuranPage> {
  const res = await fetch(`${BASE}/page/${page}/quran-uthmani`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`AlQuran API error: ${res.status}`);
  const json = await res.json();
  return { pageNumber: page, ayahs: json.data.ayahs as QuranAyah[] };
}

export async function getRandomVerse(): Promise<RandomVerse> {
  const num = Math.floor(Math.random() * 6236) + 1;
  const [arRes, enRes] = await Promise.all([
    fetch(`${BASE}/ayah/${num}/quran-uthmani`).then((r) => r.json()),
    fetch(`${BASE}/ayah/${num}/en.asad`).then((r) => r.json()),
  ]);
  return {
    ar: arRes.data.text as string,
    en: enRes.data.text as string,
    surahName: arRes.data.surah.englishName as string,
    surahNameAr: arRes.data.surah.name as string,
    ayahNum: arRes.data.numberInSurah as number,
    surahNum: arRes.data.surah.number as number,
  };
}
