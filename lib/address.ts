export type AddressLookupResult = {
  prefecture: string;
  city: string;
  town: string;
};

export type LatLng = {
  lat: number;
  lng: number;
};

type ZipCloudResponse = {
  results?: Array<{
    address1?: string;
    address2?: string;
    address3?: string;
  }> | null;
};

type GsiAddressResponse = Array<{
  geometry?: {
    coordinates?: [number, number];
  };
}>;

export async function fetchAddressByZip(
  zipcode: string,
): Promise<AddressLookupResult | null> {
  const clean = zipcode.replaceAll("-", "").trim();
  if (!/^\d{7}$/.test(clean)) return null;

  if (typeof window !== "undefined") {
    const res = await fetch(`/api/address/zipcode?zipcode=${clean}`);
    if (!res.ok) return null;
    return (await res.json()) as AddressLookupResult | null;
  }

  const res = await fetch(
    `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${clean}`,
  );
  if (!res.ok) return null;

  const data = (await res.json()) as ZipCloudResponse;
  const result = data.results?.[0];
  if (!result) return null;

  return {
    prefecture: result.address1 ?? "",
    city: result.address2 ?? "",
    town: result.address3 ?? "",
  };
}

export async function fetchLatLng(fullAddress: string): Promise<LatLng | null> {
  const query = fullAddress.trim();
  if (!query) return null;

  if (typeof window !== "undefined") {
    const res = await fetch(`/api/address/latlng?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    return (await res.json()) as LatLng | null;
  }

  const encoded = encodeURIComponent(query);
  const res = await fetch(
    `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encoded}`,
  );
  if (!res.ok) return null;

  const data = (await res.json()) as GsiAddressResponse;
  const coordinates = data[0]?.geometry?.coordinates;
  if (!coordinates) return null;

  const [lng, lat] = coordinates;
  return { lat, lng };
}

export function formatZipcode(value: string) {
  const clean = value.replace(/\D/g, "").slice(0, 7);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

export function buildFullAddress(input: {
  prefecture: string;
  city: string;
  town: string;
  building: string;
}) {
  return `${input.prefecture}${input.city}${input.town}${input.building}`.trim();
}
