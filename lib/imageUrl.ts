function setParam(url: URL, key: string, value: string) {
  url.searchParams.set(key, value);
}

export function optimizeImageUrl(
  src: string,
  options?: {
    width?: number;
    quality?: number;
  },
) {
  const width = options?.width ?? 1200;
  const quality = options?.quality ?? 60;

  try {
    const url = new URL(src);

    if (url.hostname === "images.unsplash.com") {
      setParam(url, "auto", "format");
      setParam(url, "fit", "crop");
      setParam(url, "w", String(width));
      setParam(url, "q", String(quality));
      return url.toString();
    }

    if (url.hostname.endsWith(".supabase.co")) {
      setParam(url, "width", String(width));
      setParam(url, "quality", String(quality));
      return url.toString();
    }

    return src;
  } catch {
    return src;
  }
}

