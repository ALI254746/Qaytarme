import { getApiUrl } from "./api-config";

const ARIZA_PAGE_SIZE = 50;

export function buildArizaListUrl({
  page,
  limit,
  search,
  status,
  category,
  lang,
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

  return getApiUrl(`ariza?${params.toString()}`);
}

export async function fetchAllArizalar() {
  const items = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      buildArizaListUrl({ page, limit: ARIZA_PAGE_SIZE }),
      { cache: "no-store" },
    );

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
