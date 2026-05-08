import { redirect } from "next/navigation";

export default async function StockRedirect({ params, searchParams }: { params: Promise<{ ticker: string }>; searchParams: Promise<{ market?: string }> }) {
  const { ticker } = await params;
  const { market = "EGX" } = await searchParams;
  redirect(`/wealth/stock/${ticker}?market=${market}`);
}
