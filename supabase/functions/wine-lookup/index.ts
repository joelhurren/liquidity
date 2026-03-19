import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

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
