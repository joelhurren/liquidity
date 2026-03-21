import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Vivino rating-to-percentile mapping (calibrated against real Vivino global rank data)
// e.g. 4.2 rating wine = rank ~24k/1.6M = top ~2%
function vivinoPercentile(rating: number): number {
  if (rating >= 4.5) return 99;
  if (rating >= 4.4) return 99;
  if (rating >= 4.3) return 98;
  if (rating >= 4.2) return 98;
  if (rating >= 4.1) return 96;
  if (rating >= 4.0) return 93;
  if (rating >= 3.9) return 89;
  if (rating >= 3.8) return 84;
  if (rating >= 3.7) return 78;
  if (rating >= 3.6) return 70;
  if (rating >= 3.5) return 61;
  if (rating >= 3.4) return 52;
  if (rating >= 3.3) return 43;
  if (rating >= 3.2) return 34;
  if (rating >= 3.0) return 22;
  return 10;
}

async function searchVivino(wineName: string, producer?: string | null, vintage?: number | null): Promise<{ communityScore: number; ratings: number; qualityPercentile: number; vivinoUrl: string } | null> {
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  try {
    // Include producer in search for much better matching
    const query = [producer, wineName, vintage].filter(Boolean).join(" ");
    const searchUrl = `https://www.vivino.com/search/wines?q=${encodeURIComponent(query)}`;

    const res = await fetch(searchUrl, {
      headers: { "User-Agent": UA, "Accept": "text/html" },
      redirect: "follow",
    });

    if (!res.ok) {
      console.error("Vivino search page failed:", res.status);
      return null;
    }

    const html = await res.text();

    // Vivino search page embeds wine data as HTML-entity-encoded JSON in the page.
    // Decode &quot; entities and extract wine objects with ratings.
    const decoded = html.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    // Vivino embeds wine data as HTML-entity-encoded JSON in the search page.
    // Structure: each result has a vintage with stats, then a "wine":{} object,
    // followed later by wine-level statistics (with higher ratings_count).

    // Step 1: Find all wine objects
    const winePattern = /"wine":\{"id":(\d+),"name":"([^"]+)","seo_name":"([^"]+)"/g;
    const wines: Array<{ id: number; name: string; seoName: string; pos: number }> = [];
    let wm;
    while ((wm = winePattern.exec(decoded)) !== null) {
      wines.push({ id: parseInt(wm[1]), name: wm[2], seoName: wm[3], pos: wm.index });
    }

    // Step 2: For each wine, find the vintage-level statistics (first stats block before the wine object)
    // The structure is: vintage stats → wine object → wine-level stats
    // We want the vintage-specific rating (matches the requested vintage)
    const wineBlocks: Array<{ rating: number; count: number; wineId: number; seoName: string; wineName: string }> = [];

    for (const wine of wines) {
      // Look backwards from the wine position for the vintage stats
      const beforeChunk = decoded.slice(Math.max(0, wine.pos - 3000), wine.pos);
      const statsMatches = [...beforeChunk.matchAll(/"ratings_count":(\d+),"ratings_average":([\d.]+)/g)];
      // Take the last match (closest to the wine object) — that's the vintage stats
      const vintageStats = statsMatches.length > 0 ? statsMatches[statsMatches.length - 1] : null;

      // Also find wine-level stats (after the wine object, higher count)
      const afterChunk = decoded.slice(wine.pos, wine.pos + 15000);
      const afterMatches = [...afterChunk.matchAll(/"ratings_count":(\d+),"ratings_average":([\d.]+)/g)];
      let wineLevelStats = null;
      for (const m of afterMatches) {
        const count = parseInt(m[1]);
        const rating = parseFloat(m[2]);
        if (count > 0 && rating > 0 && (!wineLevelStats || count > wineLevelStats.count)) {
          wineLevelStats = { count, rating };
        }
      }

      // Use vintage stats if they have a rating, otherwise fall back to wine-level
      const vRating = vintageStats ? parseFloat(vintageStats[2]) : 0;
      const vCount = vintageStats ? parseInt(vintageStats[1]) : 0;

      const rating = vRating > 0 ? vRating : (wineLevelStats?.rating || 0);
      const count = vRating > 0 ? vCount : (wineLevelStats?.count || 0);

      if (rating > 0) {
        wineBlocks.push({ rating, count, wineId: wine.id, seoName: wine.seoName, wineName: wine.name });
      }
    }

    if (wineBlocks.length === 0) {
      console.log("Vivino: no wine data found in search page");
      return null;
    }

    // Pick the best matching wine using strict scoring
    // Include producer in matching — this prevents "Freemark Abbey Cab Sauv" matching "Caymus Cab Sauv"
    const fullQuery = [producer, wineName].filter(Boolean).join(" ");
    const queryWords = fullQuery.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    let best = wineBlocks[0];
    let bestScore = -999;
    for (const block of wineBlocks) {
      // Check against both the wine name AND the seo_name (which often includes the producer)
      const nameLower = block.wineName.toLowerCase();
      const seoLower = block.seoName.toLowerCase().replace(/-/g, ' ');
      const combinedName = nameLower + ' ' + seoLower;

      // Count query words found in the wine name
      const found = queryWords.filter(w => combinedName.includes(w)).length;
      // Penalize for query words NOT found (missing words = likely wrong wine)
      const missing = queryWords.length - found;
      // Penalize for extra words in the wine name not in our query (prevents overly broad matches)
      const wineWords = nameLower.split(/\s+/).filter(w => w.length > 1);
      const extraInWine = wineWords.filter(w => !queryWords.some(q => q.includes(w) || w.includes(q))).length;

      const score = found * 3 - missing * 2 - extraInWine;

      if (score > bestScore || (score === bestScore && block.count > best.count)) {
        best = block;
        bestScore = score;
      }
    }
    console.log(`Vivino: best match score=${bestScore} for "${best.wineName}" (seo: ${best.seoName})`);
    console.log(`Vivino: matched "${best.wineName}" (ID:${best.wineId}) — ${best.rating}/5.0 (${best.count} ratings)`);

    // Step 3: Fetch the wine detail page to get the real global rank for percentile
    let qualityPercentile = vivinoPercentile(best.rating); // fallback
    try {
      const detailUrl = `https://www.vivino.com/w/${best.wineId}`;
      const detailRes = await fetch(detailUrl, {
        headers: { "User-Agent": UA, "Accept": "text/html" },
        redirect: "follow",
      });
      if (detailRes.ok) {
        const detailHtml = await detailRes.text();
        const detailDecoded = detailHtml.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        // Extract global rank: "global":{"description":"Global Rank","total":N,"rank":N}
        const rankMatch = detailDecoded.match(/"global":\{"description":"Global Rank","total":(\d+),"rank":(\d+)\}/);
        if (rankMatch) {
          const total = parseInt(rankMatch[1]);
          const rank = parseInt(rankMatch[2]);
          qualityPercentile = Math.round((1 - rank / total) * 100);
          console.log(`Vivino: global rank ${rank}/${total} = top ${100 - qualityPercentile}%`);
        }
      }
    } catch (e) {
      console.error("Vivino detail page fetch failed:", e);
    }

    return {
      communityScore: Math.round(best.rating * 10) / 10,
      ratings: best.count,
      qualityPercentile,
      vivinoUrl: `https://www.vivino.com/w/${best.wineId}`,
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

      // Enrich with real Vivino data (AI already finished, so this is sequential but unavoidable — we need the wine name first)
      if (wineData.name) {
        const vivino = await searchVivino(wineData.name, wineData.producer, wineData.vintage);
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

    // Run AI lookup and Vivino search in parallel — both only need the wine name
    const [response, vivino] = await Promise.all([
      fetch("https://api.anthropic.com/v1/messages", {
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
      }),
      searchVivino(name, producer, vintage).catch(() => null),
    ]);

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

    // Override AI estimates with real Vivino data
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
