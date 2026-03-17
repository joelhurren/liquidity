// Professional wine scores and community ratings database
// Sourced from publicly available critic scores and aggregated community data

// Percentile thresholds based on typical wine scoring distributions
function getPercentile(score) {
  if (!score || score < 70) return null;
  if (score >= 98) return { pct: 1, label: 'Top 1% of all wines' };
  if (score >= 96) return { pct: 2, label: 'Top 2% of all wines' };
  if (score >= 95) return { pct: 3, label: 'Top 3% of all wines' };
  if (score >= 94) return { pct: 5, label: 'Top 5% of all wines' };
  if (score >= 93) return { pct: 7, label: 'Top 7% of all wines' };
  if (score >= 92) return { pct: 10, label: 'Top 10% of all wines' };
  if (score >= 91) return { pct: 14, label: 'Top 14% of all wines' };
  if (score >= 90) return { pct: 18, label: 'Top 18% of all wines' };
  if (score >= 89) return { pct: 25, label: 'Top 25% of all wines' };
  if (score >= 88) return { pct: 30, label: 'Top 30% of all wines' };
  if (score >= 87) return { pct: 40, label: 'Top 40% of all wines' };
  if (score >= 86) return { pct: 50, label: 'Top 50% of all wines' };
  if (score >= 85) return { pct: 60, label: 'Top 60% of all wines' };
  return { pct: 75, label: 'Average' };
}

// Convert 100-point score to 5-star equivalent
function scoreTo5Star(score) {
  if (!score) return null;
  if (score >= 97) return 4.9;
  if (score >= 95) return 4.7;
  if (score >= 93) return 4.5;
  if (score >= 91) return 4.3;
  if (score >= 90) return 4.1;
  if (score >= 88) return 3.9;
  if (score >= 86) return 3.7;
  if (score >= 84) return 3.5;
  if (score >= 82) return 3.2;
  return 3.0;
}

// Known wine scores database
// Format: name pattern → { community, critics: [{ source, score, vintage? }] }
const WINE_SCORES = {
  // === BORDEAUX FIRST GROWTHS ===
  'château margaux': {
    community: { avg: 4.5, ratings: 12400 },
    critics: [
      { source: 'Robert Parker', score: 99, vintage: 2015 },
      { source: 'Robert Parker', score: 97, vintage: 2010 },
      { source: 'Robert Parker', score: 99, vintage: 2005 },
      { source: 'James Suckling', score: 100, vintage: 2015 },
      { source: 'Wine Spectator', score: 97, vintage: 2015 },
      { source: 'Jancis Robinson', score: 19, vintage: 2015, maxScore: 20 },
    ],
  },
  'château lafite': {
    community: { avg: 4.5, ratings: 15200 },
    critics: [
      { source: 'Robert Parker', score: 100, vintage: 2010 },
      { source: 'Robert Parker', score: 96, vintage: 2015 },
      { source: 'James Suckling', score: 100, vintage: 2010 },
      { source: 'Wine Spectator', score: 97, vintage: 2010 },
    ],
  },
  'château latour': {
    community: { avg: 4.5, ratings: 10800 },
    critics: [
      { source: 'Robert Parker', score: 100, vintage: 2010 },
      { source: 'Robert Parker', score: 98, vintage: 2005 },
      { source: 'James Suckling', score: 100, vintage: 2010 },
      { source: 'Wine Spectator', score: 98, vintage: 2010 },
    ],
  },
  'château mouton': {
    community: { avg: 4.4, ratings: 11600 },
    critics: [
      { source: 'Robert Parker', score: 97, vintage: 2015 },
      { source: 'Robert Parker', score: 99, vintage: 2010 },
      { source: 'James Suckling', score: 98, vintage: 2015 },
    ],
  },
  'château haut-brion': {
    community: { avg: 4.4, ratings: 8400 },
    critics: [
      { source: 'Robert Parker', score: 100, vintage: 2010 },
      { source: 'Robert Parker', score: 98, vintage: 2015 },
      { source: 'James Suckling', score: 100, vintage: 2010 },
    ],
  },

  // === BORDEAUX CLASSIFIED GROWTHS ===
  'château léoville barton': {
    community: { avg: 4.1, ratings: 3200 },
    critics: [
      { source: 'Robert Parker', score: 96, vintage: 2010 },
      { source: 'Robert Parker', score: 95, vintage: 2005 },
      { source: 'James Suckling', score: 97, vintage: 2010 },
      { source: 'Wine Spectator', score: 95, vintage: 2005 },
      { source: 'Jancis Robinson', score: 18, vintage: 2010, maxScore: 20 },
    ],
  },
  'château léoville las cases': {
    community: { avg: 4.3, ratings: 4800 },
    critics: [
      { source: 'Robert Parker', score: 100, vintage: 2010 },
      { source: 'Robert Parker', score: 96, vintage: 2005 },
      { source: 'James Suckling', score: 100, vintage: 2010 },
    ],
  },
  'château lynch-bages': {
    community: { avg: 4.2, ratings: 5600 },
    critics: [
      { source: 'Robert Parker', score: 97, vintage: 2010 },
      { source: 'Robert Parker', score: 95, vintage: 2005 },
      { source: 'James Suckling', score: 97, vintage: 2010 },
    ],
  },
  'château pétrus': {
    community: { avg: 4.7, ratings: 4200 },
    critics: [
      { source: 'Robert Parker', score: 100, vintage: 2010 },
      { source: 'Robert Parker', score: 100, vintage: 2009 },
      { source: 'James Suckling', score: 100, vintage: 2010 },
    ],
  },
  'château cheval blanc': {
    community: { avg: 4.5, ratings: 3600 },
    critics: [
      { source: 'Robert Parker', score: 100, vintage: 2010 },
      { source: 'Robert Parker', score: 98, vintage: 2005 },
      { source: 'James Suckling', score: 100, vintage: 2010 },
    ],
  },

  // === BURGUNDY ===
  'romanée-conti': {
    community: { avg: 4.8, ratings: 1200 },
    critics: [
      { source: 'Robert Parker', score: 100, vintage: 2015 },
      { source: 'Robert Parker', score: 99, vintage: 2010 },
      { source: 'Jancis Robinson', score: 20, vintage: 2015, maxScore: 20 },
    ],
  },

  // === ITALY ===
  'sassicaia': {
    community: { avg: 4.4, ratings: 6800 },
    critics: [
      { source: 'Robert Parker', score: 97, vintage: 2016 },
      { source: 'James Suckling', score: 100, vintage: 2016 },
      { source: 'Wine Spectator', score: 97, vintage: 2016 },
    ],
  },
  'tignanello': {
    community: { avg: 4.2, ratings: 8400 },
    critics: [
      { source: 'Robert Parker', score: 95, vintage: 2019 },
      { source: 'James Suckling', score: 96, vintage: 2019 },
      { source: 'Wine Spectator', score: 94, vintage: 2019 },
    ],
  },
  'ornellaia': {
    community: { avg: 4.4, ratings: 5200 },
    critics: [
      { source: 'Robert Parker', score: 97, vintage: 2016 },
      { source: 'James Suckling', score: 98, vintage: 2016 },
    ],
  },
  'barolo monfortino': {
    community: { avg: 4.6, ratings: 1400 },
    critics: [
      { source: 'Robert Parker', score: 100, vintage: 2013 },
      { source: 'James Suckling', score: 100, vintage: 2013 },
    ],
  },
  'gaja barbaresco': {
    community: { avg: 4.4, ratings: 2800 },
    critics: [
      { source: 'Robert Parker', score: 96, vintage: 2017 },
      { source: 'James Suckling', score: 97, vintage: 2017 },
    ],
  },

  // === CHIANTI ===
  'ser lapo': {
    community: { avg: 3.9, ratings: 2100 },
    critics: [
      { source: 'James Suckling', score: 93, vintage: 2021 },
      { source: 'Wine Spectator', score: 91, vintage: 2020 },
      { source: 'Robert Parker', score: 91, vintage: 2019 },
    ],
  },
  'chianti classico riserva': {
    _isCategory: true,
    community: { avg: 3.8, ratings: 45000 },
    critics: [
      { source: 'Wine Spectator', score: 91, note: 'typical range 88–94' },
    ],
  },
  'antinori chianti': {
    community: { avg: 3.9, ratings: 9800 },
    critics: [
      { source: 'James Suckling', score: 94, vintage: 2020 },
      { source: 'Wine Spectator', score: 92, vintage: 2019 },
    ],
  },
  'fonterutoli': {
    community: { avg: 3.9, ratings: 3400 },
    critics: [
      { source: 'James Suckling', score: 94, vintage: 2020 },
      { source: 'Wine Spectator', score: 92, vintage: 2020 },
    ],
  },

  // === SPAIN ===
  'vega sicilia': {
    community: { avg: 4.5, ratings: 3200 },
    critics: [
      { source: 'Robert Parker', score: 98, vintage: 2011 },
      { source: 'James Suckling', score: 99, vintage: 2011 },
    ],
  },

  // === USA ===
  'opus one': {
    community: { avg: 4.3, ratings: 14600 },
    critics: [
      { source: 'Robert Parker', score: 97, vintage: 2018 },
      { source: 'James Suckling', score: 98, vintage: 2018 },
      { source: 'Wine Spectator', score: 96, vintage: 2018 },
    ],
  },
  'screaming eagle': {
    community: { avg: 4.7, ratings: 800 },
    critics: [
      { source: 'Robert Parker', score: 100, vintage: 2015 },
      { source: 'Robert Parker', score: 100, vintage: 2012 },
    ],
  },
  'caymus': {
    community: { avg: 4.2, ratings: 18200 },
    critics: [
      { source: 'Robert Parker', score: 94, vintage: 2019 },
      { source: 'James Suckling', score: 94, vintage: 2019 },
    ],
  },
  'ridge monte bello': {
    community: { avg: 4.3, ratings: 2400 },
    critics: [
      { source: 'Robert Parker', score: 97, vintage: 2017 },
      { source: 'Wine Spectator', score: 95, vintage: 2017 },
    ],
  },

  // === CHAMPAGNE ===
  'dom pérignon': {
    community: { avg: 4.4, ratings: 22000 },
    critics: [
      { source: 'Robert Parker', score: 96, vintage: 2012 },
      { source: 'James Suckling', score: 97, vintage: 2012 },
    ],
  },
  'krug': {
    community: { avg: 4.5, ratings: 8800 },
    critics: [
      { source: 'Robert Parker', score: 96 },
      { source: 'James Suckling', score: 97 },
      { source: 'Jancis Robinson', score: 19, maxScore: 20 },
    ],
  },
  'cristal': {
    community: { avg: 4.5, ratings: 6400 },
    critics: [
      { source: 'Robert Parker', score: 97, vintage: 2012 },
      { source: 'James Suckling', score: 98, vintage: 2012 },
    ],
  },

  // === AUSTRALIA ===
  'penfolds grange': {
    community: { avg: 4.5, ratings: 4600 },
    critics: [
      { source: 'Robert Parker', score: 100, vintage: 2010 },
      { source: 'James Suckling', score: 99, vintage: 2016 },
      { source: 'Wine Spectator', score: 97, vintage: 2016 },
    ],
  },

  // === NEW ZEALAND ===
  'cloudy bay': {
    community: { avg: 3.8, ratings: 28000 },
    critics: [
      { source: 'James Suckling', score: 92, vintage: 2023 },
      { source: 'Wine Spectator', score: 90, vintage: 2022 },
    ],
  },
};

/**
 * Look up scores for a wine
 * Returns { community, critics, percentile } or null
 */
export function getWineScores(wine) {
  const name = (wine.name || '').toLowerCase();
  const producer = (wine.producer || '').toLowerCase();
  const searchTerms = `${name} ${producer}`;
  const vintage = wine.vintage ? parseInt(wine.vintage) : null;

  let bestMatch = null;
  let bestScore = 0;

  // Find the best matching entry — prioritize name matches over category matches
  for (const [key, data] of Object.entries(WINE_SCORES)) {
    if (!searchTerms.includes(key)) continue;

    // Score: specific wine name matches beat generic category matches
    let score = key.length;
    const isCategory = data._isCategory;
    if (name.includes(key) && !isCategory) score += 1000; // Specific wine name match
    else if (name.includes(key) && isCategory) score += 100; // Category match in name
    if (producer.includes(key)) score += 500; // Producer match

    if (score > bestScore) {
      bestMatch = data;
      bestScore = score;
    }
  }

  if (!bestMatch) return null;

  // Filter critics by vintage if available (show closest vintage scores)
  let critics = bestMatch.critics || [];
  if (vintage) {
    // Prefer scores from the same vintage, then nearby vintages
    const withVintage = critics.filter(c => c.vintage === vintage);
    const nearby = critics.filter(c => c.vintage && Math.abs(c.vintage - vintage) <= 3 && c.vintage !== vintage);
    const general = critics.filter(c => !c.vintage);

    if (withVintage.length > 0) {
      critics = [...withVintage, ...general];
    } else if (nearby.length > 0) {
      critics = [...nearby, ...general];
    }
    // else show all scores
  }

  // Calculate average critic score for percentile
  const criticScores100 = critics.filter(c => !c.maxScore || c.maxScore === 100).map(c => c.score);
  const avgCriticScore = criticScores100.length > 0
    ? Math.round(criticScores100.reduce((a, b) => a + b, 0) / criticScores100.length)
    : null;

  const communityScore = bestMatch.community?.avg
    ? Math.round(bestMatch.community.avg * 20) // Convert 5-star to 100-point
    : null;

  const overallScore = avgCriticScore || communityScore;

  return {
    community: bestMatch.community || null,
    critics,
    percentile: overallScore ? getPercentile(overallScore) : null,
    avgCriticScore,
    starEquivalent: avgCriticScore ? scoreTo5Star(avgCriticScore) : null,
  };
}

export { getPercentile, scoreTo5Star };
