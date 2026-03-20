import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Vivino rating-to-percentile mapping (based on Vivino's published benchmarks)
function vivinoPercentile(rating: number): number {
  if (rating >= 4.5) return 99;
  if (rating >= 4.3) return 97;
  if (rating >= 4.1) return 94;
  if (rating >= 4.0) return 91;
  if (rating >= 3.9) return 87;
  if (rating >= 3.8) return 82;
  if (rating >= 3.7) return 76;
  if (rating >= 3.6) return 69;
  if (rating >= 3.5) return 61;
  if (rating >= 3.4) return 52;
  if (rating >= 3.3) return 43;
  if (rating >= 3.2) return 34;
  if (rating >= 3.0) return 22;
  return 10;
}

async function searchVivino(wineName: string, vintage?: number | null): Promise<{ communityScore: number; ratings: number; qualityPercentile: number; vivinoUrl: string } | null> {
  try {
    const query = [wineName, vintage].filter(Boolean).join(" ");
    const url = `https://www.vivino.com/search/wines?q=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      console.error("Vivino search failed:", res.status);
      return null;
    }

    const html = await res.text();

    // Extract wine card data from the search results HTML
    // Vivino embeds rating data in their wine cards
    // Look for the average rating pattern: class="average__number" or similar
    const ratingMatch = html.match(/average__number[^>]*>(\d+\.?\d*)/);
    const ratingsCountMatch = html.match(/average__stars[^}]*?(\d[\d,]*)\s*ratings/i)
      || html.match(/(\d[\d,]*)\s*ratings/i);

    // Try JSON-LD or embedded data
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);

    // Try the Vivino explore API as fallback
    if (!ratingMatch) {
      const apiUrl = `https://www.vivino.com/api/explore/explore?q=${encodeURIComponent(query)}&page=1&per_page=1`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
      });

      if (apiRes.ok) {
        const apiData = await apiRes.json();
        const matches = apiData?.explore_vintage?.matches;
        if (matches?.length > 0) {
          const topMatch = matches[0].vintage?.wine || matches[0].wine;
          const vintageData = matches[0].vintage;
          const rating = vintageData?.statistics?.ratings_average
            || topMatch?.statistics?.ratings_average
            || topMatch?.ratings_average;
          const count = vintageData?.statistics?.ratings_count
            || topMatch?.statistics?.ratings_count
            || topMatch?.ratings_count;
          const wineId = topMatch?.id;
          const slug = topMatch?.seo_name;

          if (rating) {
            const score = parseFloat(rating);
            return {
              communityScore: Math.round(score * 10) / 10,
              ratings: parseInt(count) || 0,
              qualityPercentile: vivinoPercentile(score),
              vivinoUrl: slug ? `https://www.vivino.com/w/${wineId}` : url,
            };
          }
        }
      }

      console.log("Vivino: no rating found in HTML or API");
      return null;
    }

    const rating = parseFloat(ratingMatch[1]);
    const ratingsCount = ratingsCountMatch ? parseInt(ratingsCountMatch[1].replace(/,/g, "")) : 0;

    return {
      communityScore: Math.round(rating * 10) / 10,
      ratings: ratingsCount,
      qualityPercentile: vivinoPercentile(rating),
      vivinoUrl: url,
    };
  } catch (err) {
    console.error("Vivino search error:", err);
    return null;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WINE_JSON_SCHEMA = `{
  "name": "wine name as shown on the label",
  "producer": "winery/producer name",
  "vintage": year number or null,
  "region": "wine region (e.g. Bordeaux, Napa Valley, Barossa Valley)",
  "country": "country of origin",
  "appellation": "specific appellation/AOC/DOC if applicable",
  "type": "red|white|rosé|sparkling|dessert|fortified",
  "grapeVarieties": ["array", "of", "grape", "varieties"],
  "classification": "e.g. Grand Cru, Reserva, etc. if applicable",
  "alcoholPercent": number or null,
  "foodPairings": ["array of 5-8 specific food pairing suggestions"],
  "tastingNotes": "2-3 sentence description of typical aromas, flavors, body, and finish",
  "drinkFrom": year number (earliest year to drink, considering vintage),
  "drinkTo": year number (latest year to drink at peak, considering vintage),
  "criticScores": [
    { "source": "critic name (e.g. Robert Parker, James Suckling, Wine Spectator, Jancis Robinson, Decanter)", "score": number, "maxScore": 100 (or 20 for Jancis Robinson), "vintage": year or null }
  ],
  "communityScore": number 1.0-5.0 (estimated Vivino-style community average rating — ALWAYS provide your best estimate even for lesser-known wines),
  "qualityPercentile": number 1-100 (what percentile this wine falls in among ALL wines globally — e.g. 95 means top 5%. ALWAYS provide your best estimate based on region, producer reputation, classification, and price tier)
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { name, producer, vintage, region, type, grapeVarieties, image } = body;

    // Image-based label scanning
    if (image) {
      // Extract base64 data and media type from data URL
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: "Invalid image format. Expected base64 data URL." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const mediaType = match[1];
      const imageData = match[2];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: imageData,
                  },
                },
                {
                  type: "text",
                  text: `You are a master sommelier. Look at this wine label photo and extract all the information you can identify.

Return a JSON object with the following fields. Only include fields you can confidently determine from the label. For fields you can't see or determine, omit them or set to null.

${WINE_JSON_SCHEMA}

Return ONLY valid JSON, no other text.`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Anthropic API error (vision):", response.status, errorText);
        return new Response(
          JSON.stringify({ error: `AI vision failed (${response.status}): ${errorText.slice(0, 200)}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(
          JSON.stringify({ error: "Could not parse AI vision response" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const wineData = JSON.parse(jsonMatch[0]);

      // Enrich with real Vivino data if we got a wine name
      if (wineData.name) {
        const vivino = await searchVivino(wineData.name, wineData.vintage);
        if (vivino) {
          wineData.communityScore = vivino.communityScore;
          wineData.communityRatings = vivino.ratings;
          wineData.qualityPercentile = vivino.qualityPercentile;
          wineData.vivinoUrl = vivino.vivinoUrl;
        }
      }

      return new Response(JSON.stringify(wineData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Text-based lookup (existing flow)
    if (!name) {
      return new Response(
        JSON.stringify({ error: "Wine name or image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wineDescription = [
      name,
      producer && producer !== name ? `by ${producer}` : "",
      vintage ? `(${vintage})` : "",
      region ? `from ${region}` : "",
      type ? `- ${type} wine` : "",
      grapeVarieties?.length ? `made from ${grapeVarieties.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a master sommelier. Given this wine: ${wineDescription}

Return a JSON object with the following fields. For most fields, only include if confident. But for criticScores, communityScore, and qualityPercentile you MUST always provide your best estimate — even for lesser-known wines, estimate based on region, producer, classification, grape variety, and price tier.

${WINE_JSON_SCHEMA}

Return ONLY valid JSON, no other text.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI lookup failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Could not parse AI response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wineData = JSON.parse(jsonMatch[0]);

    // Enrich with real Vivino data
    const vivino = await searchVivino(name, vintage);
    if (vivino) {
      wineData.communityScore = vivino.communityScore;
      wineData.communityRatings = vivino.ratings;
      wineData.qualityPercentile = vivino.qualityPercentile;
      wineData.vivinoUrl = vivino.vivinoUrl;
    }

    return new Response(JSON.stringify(wineData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
