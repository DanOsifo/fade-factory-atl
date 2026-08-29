import { Router, type IRouter } from "express";

const router: IRouter = Router();

const GOOGLE_API_KEY = process.env["GOOGLE_PLACES_API_KEY"];
const PLACE_QUERY = "Fade Factory ATL 1000 Northside Dr NW Atlanta GA";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface GoogleReview {
  author_name: string;
  author_url: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

let cachedPlaceId: string | null = null;
let cachedReviews: GoogleReview[] | null = null;
let cacheTimestamp = 0;

async function resolvePlaceId(): Promise<string | null> {
  if (cachedPlaceId) return cachedPlaceId;
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
  );
  url.searchParams.set("input", PLACE_QUERY);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id");
  url.searchParams.set("key", GOOGLE_API_KEY!);
  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    candidates?: { place_id: string }[];
  };
  cachedPlaceId = data.candidates?.[0]?.place_id ?? null;
  return cachedPlaceId;
}

async function loadReviews(): Promise<GoogleReview[]> {
  const placeId = await resolvePlaceId();
  if (!placeId) return [];
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "reviews,rating,user_ratings_total");
  url.searchParams.set("key", GOOGLE_API_KEY!);
  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    result?: { reviews?: GoogleReview[] };
  };
  return data.result?.reviews ?? [];
}

router.get("/reviews", async (req, res) => {
  if (!GOOGLE_API_KEY) {
    res.status(503).json({ error: "GOOGLE_PLACES_API_KEY not configured", reviews: [] });
    return;
  }

  const now = Date.now();
  if (cachedReviews && now - cacheTimestamp < CACHE_TTL_MS) {
    res.json({ reviews: cachedReviews, fromCache: true });
    return;
  }

  try {
    const reviews = await loadReviews();
    cachedReviews = reviews;
    cacheTimestamp = now;
    res.json({ reviews });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch Google Places reviews");
    if (cachedReviews) {
      res.json({ reviews: cachedReviews, fromCache: true });
    } else {
      res.status(500).json({ error: "Failed to fetch reviews", reviews: [] });
    }
  }
});

export default router;
