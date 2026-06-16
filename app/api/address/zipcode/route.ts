import { fetchAddressByZip } from "@/lib/address";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zipcode = searchParams.get("zipcode") ?? "";
  const address = await fetchAddressByZip(zipcode);

  return Response.json(address);
}
