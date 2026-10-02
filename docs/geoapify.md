# Geoapify location search

Set GEOAPIFY_API_KEY in the backend environment. The key stays on the server.

- GET /api/geocoding/search?q=... searches Uzbekistan addresses and normalizes common Shahrixon spellings.
- GET /api/geocoding/reverse?lat=...&lng=... returns an address for a user-selected map point, including region and district.
- Telegram ingestion searches extracted incident location phrases. Named school, market and transport POIs can be searched through Places API inside a resolved administrative boundary. Ambiguous or unsupported locations remain unresolved; a town center is never substituted for an incident point.
- Numbered schools must match the school number. Named neighborhoods must also match. Returned landmark coordinates remain approximate, with the matched label, query and provider metadata retained.
- Desktop map search offers 2, 5, 10, 25 and 50 km radius filters over approved listings with known coordinates. Missing coordinates do not appear as map markers.
- Desktop listing creation requires the user to select the incident location. Current device position and the default map center are not automatically submitted as the incident point.

All Geoapify requests share Redis caching (24 hours), request spacing and the existing daily request cap. Without Redis, the fallback is local to one backend process. Map tiles continue to use OpenStreetMap. Previously imported listings are not automatically rewritten.

Validation: npm --prefix backend test -- --runInBand geocoding; backend TypeScript check; frontend production build; live forward/reverse/Places requests; browser map search.
