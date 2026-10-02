import { getApiUrl } from "./api-config";

const ARIZA_PAGE_SIZE = 50;

export function buildArizaListUrl({
  page,
  limit,
  search,
  status,
  category,
  lang,
  source,
  region,
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const normalizedSearch = typeof search === "string" ? search.trim() : "";
  if (normalizedSearch) params.set("search", normalizedSearch);
  if (status && status !== "all") params.set("status", status);
  if (category && category !== "all") params.set("category", category);
  if (lang) params.set("lang", lang);
  if (source && source !== "all") params.set("source", source);
  if (region) params.set("region", region);

  return getApiUrl(`ariza?${params.toString()}`);
}

async function fetchListingPage(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {cache: "no-store", signal: AbortSignal.timeout(15000)});
      if (response.ok || response.status < 500 || attempt === 2) return response;
    } catch (error) {
      if (attempt === 2) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
  }
}

export async function fetchAllArizalar() {
  const items = [];
  let page = 1;

  while (true) {
    const response = await fetchListingPage(buildArizaListUrl({ page, limit: ARIZA_PAGE_SIZE }));

    if (!response.ok) {
      throw new Error(`E'lonlarni olishda xatolik (HTTP ${response.status})`);
    }

    const data = await response.json();
    const pageItems = Array.isArray(data)
      ? data
      : data?.arizalar ?? data?.items ?? data?.data ?? [];

    if (!Array.isArray(pageItems)) {
      throw new Error("E'lonlar API javobi kutilgan formatda emas");
    }

    items.push(...pageItems);

    const hasMore =
      typeof data?.hasMore === "boolean"
        ? data.hasMore
        : pageItems.length >= ARIZA_PAGE_SIZE;

    if (!hasMore || pageItems.length === 0) return items;
    page += 1;
  }
}
