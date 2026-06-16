import { fetchLatLng } from "@/lib/address";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const coords = await fetchLatLng(query);

  return Response.json(coords);
}
