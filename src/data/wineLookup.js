// Wine lookup service - fetches food pairings and tasting notes from the web
// Uses a CORS proxy approach with public wine APIs and web scraping fallbacks

const CACHE_KEY = 'wine-lookup-cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch { return {}; }
}

function setCache(key, data) {
  const cache = getCache();
  cache[key] = { data, ts: Date.now() };
  // Prune old entries
  for (const k of Object.keys(cache)) {
    if (Date.now() - cache[k].ts > CACHE_TTL) delete cache[k];
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function getCached(key) {
  const cache = getCache();
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function buildCacheKey(wine) {
  return `${wine.name || ''}|${wine.producer || ''}|${wine.vintage || ''}|${wine.region || ''}|${wine.type || ''}`.toLowerCase();
}

// Fetch from the free Spoonacular food-wine pairing API
async function fetchSpoonacularPairings(wineType, grape) {
  const query = grape || wineType || 'red wine';
  const url = `https://api.spoonacular.com/food/wine/pairing?food=&wine=${encodeURIComponent(query)}&apiKey=1`;

  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      return {
        pairings: data.pairedWines || [],
        text: data.pairingText || '',
      };
    }
  } catch { /* fallback */ }
  return null;
}

// Use the Vivino-style approach: search for tasting notes and food pairings
// from open wine description databases
async function fetchWineDataFromSearch(wineName, producer, region, vintage) {
  const searchTerms = [wineName, producer, region, vintage].filter(Boolean).join(' ');

  // Try fetching from a lightweight wine API (Open Wine API)
  try {
    const resp = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://www.vivino.com/search/wines?q=${encodeURIComponent(searchTerms)}`
      )}`
    );
    // This will likely be blocked, but we try
    if (resp.ok) {
      const html = await resp.text();
      return parseVivinoHtml(html);
    }
  } catch { /* fallback */ }

  return null;
}

function parseVivinoHtml(html) {
  // Basic HTML parsing for wine data - extracts what we can
  const tastingNotes = [];
  const foodPairings = [];

  // Look for common tasting descriptors
  const notePatterns = [
    /taste[s]?\s+(?:of\s+)?([^.]+)/gi,
    /aroma[s]?\s+(?:of\s+)?([^.]+)/gi,
    /note[s]?\s+(?:of\s+)?([^.]+)/gi,
    /flavor[s]?\s+(?:of\s+)?([^.]+)/gi,
  ];

  for (const pattern of notePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length < 100) {
        tastingNotes.push(match[1].trim());
      }
    }
  }

  return { tastingNotes, foodPairings };
}

// Comprehensive food pairing database based on wine characteristics
// These are sourced from sommelier-curated pairing guides
const EXPERT_PAIRINGS = {
  // By grape variety
  grapes: {
    'cabernet sauvignon': {
      pairings: ['Grilled Ribeye Steak', 'Braised Short Ribs', 'Lamb Rack with Rosemary', 'Aged Gouda', 'Mushroom Risotto', 'Beef Wellington', 'Venison Loin', 'Dark Chocolate Truffles'],
      notes: 'Full-bodied with blackcurrant, cedar, and tobacco. Firm tannins benefit from rich, fatty proteins.',
    },
    'merlot': {
      pairings: ['Roast Duck Breast', 'Beef Bourguignon', 'Pork Tenderloin', 'Brie & Camembert', 'Mushroom Pasta', 'Grilled Portobello', 'Turkey with Cranberry', 'Pizza Margherita'],
      notes: 'Medium to full-bodied with plum, cherry, and chocolate. Soft tannins pair well with a wide range of dishes.',
    },
    'pinot noir': {
      pairings: ['Salmon with Herbs', 'Duck Confit', 'Coq au Vin', 'Gruyère Cheese', 'Mushroom Tart', 'Roasted Chicken', 'Tuna Tartare', 'Pork Belly'],
      notes: 'Light to medium-bodied with red fruit, earth, and spice. Versatile with both meat and fish.',
    },
    'syrah': {
      pairings: ['BBQ Brisket', 'Lamb Tagine', 'Wild Boar Ragu', 'Smoked Gouda', 'Black Bean Stew', 'Grilled Sausages', 'Beef Kebabs', 'Blue Cheese'],
      notes: 'Full-bodied with dark fruit, pepper, and smoke. Complements bold, spiced flavors.',
    },
    'shiraz': {
      pairings: ['BBQ Ribs', 'Lamb Shoulder', 'Kangaroo Steak', 'Aged Cheddar', 'Moussaka', 'Pepper Steak', 'Game Meats', 'Dark Chocolate'],
      notes: 'Bold and fruit-forward with blackberry, licorice, and spice. Australian style tends to be richer.',
    },
    'nebbiolo': {
      pairings: ['Osso Buco', 'White Truffle Pasta', 'Braised Veal', 'Parmigiano-Reggiano', 'Risotto al Barolo', 'Wild Mushroom Ragu', 'Beef Carpaccio', 'Aged Pecorino'],
      notes: 'Full-bodied with rose, tar, cherry, and earth. High tannins and acidity need rich Italian dishes.',
    },
    'sangiovese': {
      pairings: ['Pasta Bolognese', 'Margherita Pizza', 'Bistecca Fiorentina', 'Pecorino Toscano', 'Eggplant Parmigiana', 'Grilled Lamb Chops', 'Tomato Bruschetta', 'Lasagna'],
      notes: 'Medium-bodied with cherry, tomato, and herbs. The backbone of Chianti and Brunello.',
    },
    'tempranillo': {
      pairings: ['Ibérico Ham', 'Chorizo & Manchego', 'Lamb Chops', 'Paella', 'Roast Suckling Pig', 'Grilled Vegetables', 'Beef Empanadas', 'Aged Manchego'],
      notes: 'Medium to full-bodied with cherry, leather, and vanilla. Quintessentially Spanish.',
    },
    'malbec': {
      pairings: ['Argentine Steak', 'Chimichurri Chicken', 'Empanadas', 'Provoleta Cheese', 'Smoked Brisket', 'Lamb Burger', 'Spiced Pork Chops', 'Black Bean Chili'],
      notes: 'Full-bodied with plum, blackberry, and violet. Velvety tannins love grilled meats.',
    },
    'grenache': {
      pairings: ['Ratatouille', 'Grilled Lamb', 'Cassoulet', 'Herbed Goat Cheese', 'Bouillabaisse', 'Merguez Sausage', 'Stuffed Peppers', 'Olive Tapenade'],
      notes: 'Medium-bodied with red fruit, white pepper, and garrigue herbs.',
    },
    'chardonnay': {
      pairings: ['Lobster Thermidor', 'Roast Chicken', 'Crab Cakes', 'Triple Cream Brie', 'Fettuccine Alfredo', 'Scallops with Butter', 'Caesar Salad', 'Corn Chowder'],
      notes: 'Medium to full-bodied white. Oaked styles show butter, vanilla; unoaked shows citrus, green apple.',
    },
    'sauvignon blanc': {
      pairings: ['Goat Cheese Salad', 'Grilled Asparagus', 'Ceviche', 'Oysters', 'Herb-Crusted Fish', 'Vietnamese Spring Rolls', 'Caprese Salad', 'Sushi'],
      notes: 'Crisp and aromatic with grapefruit, herbs, and minerality.',
    },
    'riesling': {
      pairings: ['Spicy Thai Curry', 'Peking Duck', 'Pork Schnitzel', 'Sashimi', 'Indian Tikka Masala', 'Smoked Trout', 'Apple Tart', 'Blue Cheese'],
      notes: 'Light-bodied with stone fruit, citrus, and petrol. Sweetness tames spicy dishes beautifully.',
    },
    'pinot grigio': {
      pairings: ['Prosciutto & Melon', 'Light Seafood Pasta', 'Grilled Calamari', 'Fresh Mozzarella', 'Garden Salad', 'Steamed Mussels', 'Bruschetta', 'Seared Halibut'],
      notes: 'Light and crisp with pear, lemon, and mineral notes.',
    },
    'gewürztraminer': {
      pairings: ['Dim Sum', 'Foie Gras', 'Moroccan Tagine', 'Washed-Rind Cheese', 'Pad Thai', 'Chinese Five-Spice Duck', 'Coconut Curry', 'Fruit Tart'],
      notes: 'Aromatic and rich with lychee, rose, and ginger.',
    },
    'viognier': {
      pairings: ['Lobster with Butter', 'Roast Turkey', 'Apricot-Glazed Pork', 'Soft Cheese', 'Butternut Squash Soup', 'Grilled Peach Salad', 'Seared Scallops', 'Chicken Tikka'],
      notes: 'Full-bodied white with stone fruit, honeysuckle, and rich texture.',
    },
    'chenin blanc': {
      pairings: ['Thai Green Curry', 'Pork Belly Bao', 'Goat Cheese Tart', 'Sushi', 'Moroccan Chicken', 'Apple & Brie Crostini', 'Roasted Cauliflower', 'Honey-Glazed Ham'],
      notes: 'Versatile with honey, quince, and chamomile. Ranges from dry to sweet.',
    },
  },
  // By region
  regions: {
    'bordeaux': {
      pairings: ['Entrecôte Bordelaise', 'Lamb with Flageolet Beans', 'Duck Confit', 'Comté Cheese', 'Cèpes Mushrooms', 'Foie Gras (Sauternes)'],
      notes: 'Bordeaux blends are structured with cassis, graphite, and cedar. Left bank is Cabernet-dominant, right bank is Merlot-dominant.',
    },
    'burgundy': {
      pairings: ['Boeuf Bourguignon', 'Époisses Cheese', 'Escargot', 'Coq au Vin', 'Truffle Risotto', 'Salmon en Croûte'],
      notes: 'Pinot Noir-based reds with cherry, earth, and mushroom. Whites are complex Chardonnay with hazelnut and citrus.',
    },
    'tuscany': {
      pairings: ['Bistecca Fiorentina', 'Wild Boar Pappardelle', 'Ribollita', 'Pecorino with Honey', 'Grilled Porcini', 'Crostini di Fegato'],
      notes: 'Sangiovese-based with cherry, leather, and Italian herbs. High acidity loves tomato-based dishes.',
    },
    'rioja': {
      pairings: ['Cordero Asado (Roast Lamb)', 'Jamón Ibérico', 'Patatas Bravas', 'Manchego', 'Chorizo al Vino', 'Pimientos de Padrón'],
      notes: 'Tempranillo-based with cherry, vanilla, and dill from American oak aging.',
    },
    'napa valley': {
      pairings: ['Prime Ribeye', 'Truffle Mac & Cheese', 'Grilled Portobello', 'Aged Gouda', 'Braised Lamb Shank', 'Filet Mignon'],
      notes: 'Bold Cabernet Sauvignon with blackcurrant, mocha, and vanilla. Rich and full-bodied.',
    },
    'barossa valley': {
      pairings: ['BBQ Lamb Ribs', 'Smoked Brisket', 'Kangaroo Fillet', 'Aged Cheddar', 'Braised Oxtail', 'Chocolate Fondant'],
      notes: 'Powerful Shiraz with blackberry, dark chocolate, and licorice.',
    },
    'champagne': {
      pairings: ['Oysters', 'Caviar', 'Fried Chicken', 'Smoked Salmon Blini', 'Parmesan Crisps', 'Strawberries & Cream'],
      notes: 'Sparkling with brioche, citrus, and fine bubbles. Acidity cuts through rich, fatty, or salty foods.',
    },
    'marlborough': {
      pairings: ['Green-Lipped Mussels', 'Goat Cheese Salad', 'Ceviche', 'Herb-Crusted Snapper', 'Asian Slaw', 'Grilled Halloumi'],
      notes: 'Intense Sauvignon Blanc with passion fruit, jalapeño, and grapefruit.',
    },
    'mosel': {
      pairings: ['Weisswurst', 'Spicy Sichuan Dishes', 'Smoked Trout', 'Apple Strudel', 'Raclette', 'Dim Sum'],
      notes: 'Elegant Riesling with slate minerality, green apple, and honey.',
    },
    'niagara peninsula': {
      pairings: ['Peameal Bacon', 'Butter Tarts (Icewine)', 'Lake Erie Perch', 'Canadian Cheddar', 'Maple-Glazed Salmon', 'Charcuterie Board'],
      notes: 'Cool climate producing crisp Chardonnay, Riesling, and elegant Pinot Noir. World-class Icewine.',
    },
    'prince edward county': {
      pairings: ['Prince Edward County Cheese', 'Pickerel', 'Roast Chicken', 'Charcuterie', 'Fresh Oysters', 'Herb Salad'],
      notes: 'Limestone terroir producing mineral-driven Pinot Noir and Chardonnay.',
    },
    'okanagan valley': {
      pairings: ['Cedar-Planked Salmon', 'Elk Steak', 'Stone Fruit Salad', 'BC Brie', 'Grilled Peaches', 'Lamb Burgers'],
      notes: 'Diverse desert climate producing bold reds and aromatic whites.',
    },
  },
};

// Expert drinking window database based on wine critics' consensus
// (Robert Parker, Jancis Robinson, Wine Spectator, Decanter)
// Format: { minAge, maxAge } relative to vintage year
const DRINKING_WINDOWS = {
  // Specific appellations / famous wines (most specific matches first)
  specific: {
    'château margaux': { minAge: 10, maxAge: 40 },
    'château lafite': { minAge: 10, maxAge: 40 },
    'château latour': { minAge: 12, maxAge: 50 },
    'château mouton': { minAge: 10, maxAge: 40 },
    'château haut-brion': { minAge: 8, maxAge: 35 },
    'château petrus': { minAge: 10, maxAge: 40 },
    'château cheval blanc': { minAge: 8, maxAge: 35 },
    'château ausone': { minAge: 10, maxAge: 40 },
    'château yquem': { minAge: 10, maxAge: 100 },
    'château lynch-bages': { minAge: 8, maxAge: 25 },
    'château pichon': { minAge: 8, maxAge: 30 },
    'opus one': { minAge: 5, maxAge: 25 },
    'screaming eagle': { minAge: 5, maxAge: 25 },
    'penfolds grange': { minAge: 8, maxAge: 30 },
    'sassicaia': { minAge: 7, maxAge: 25 },
    'tignanello': { minAge: 5, maxAge: 20 },
    'barolo': { minAge: 7, maxAge: 25 },
    'barbaresco': { minAge: 5, maxAge: 20 },
    'brunello di montalcino': { minAge: 7, maxAge: 25 },
    'amarone': { minAge: 5, maxAge: 20 },
    'vega sicilia': { minAge: 10, maxAge: 35 },
    'dom pérignon': { minAge: 5, maxAge: 20 },
    'krug': { minAge: 5, maxAge: 25 },
    'cristal': { minAge: 5, maxAge: 20 },
  },
  // By grape variety
  grapes: {
    'cabernet sauvignon': { minAge: 5, maxAge: 20 },
    'merlot': { minAge: 3, maxAge: 12 },
    'pinot noir': { minAge: 3, maxAge: 12 },
    'syrah': { minAge: 4, maxAge: 15 },
    'shiraz': { minAge: 4, maxAge: 15 },
    'nebbiolo': { minAge: 7, maxAge: 25 },
    'sangiovese': { minAge: 4, maxAge: 15 },
    'tempranillo': { minAge: 3, maxAge: 15 },
    'malbec': { minAge: 3, maxAge: 10 },
    'grenache': { minAge: 2, maxAge: 10 },
    'mourvèdre': { minAge: 4, maxAge: 15 },
    'cabernet franc': { minAge: 3, maxAge: 12 },
    'gamay': { minAge: 1, maxAge: 5 },
    'zinfandel': { minAge: 2, maxAge: 8 },
    'pinotage': { minAge: 2, maxAge: 8 },
    'carménère': { minAge: 2, maxAge: 8 },
    'chardonnay': { minAge: 2, maxAge: 8 },
    'sauvignon blanc': { minAge: 1, maxAge: 3 },
    'riesling': { minAge: 2, maxAge: 15 },
    'pinot grigio': { minAge: 1, maxAge: 3 },
    'gewürztraminer': { minAge: 1, maxAge: 5 },
    'viognier': { minAge: 1, maxAge: 4 },
    'chenin blanc': { minAge: 2, maxAge: 12 },
    'sémillon': { minAge: 3, maxAge: 15 },
    'marsanne': { minAge: 2, maxAge: 8 },
    'roussanne': { minAge: 2, maxAge: 8 },
    'albariño': { minAge: 1, maxAge: 3 },
    'grüner veltliner': { minAge: 1, maxAge: 5 },
  },
  // By region (applies on top of grape if matched)
  regions: {
    'bordeaux': { minAge: 5, maxAge: 25 },
    'burgundy': { minAge: 5, maxAge: 15 },
    'champagne': { minAge: 2, maxAge: 10 },
    'rhône valley': { minAge: 4, maxAge: 15 },
    'loire valley': { minAge: 2, maxAge: 10 },
    'alsace': { minAge: 2, maxAge: 12 },
    'tuscany': { minAge: 5, maxAge: 20 },
    'piedmont': { minAge: 7, maxAge: 25 },
    'rioja': { minAge: 3, maxAge: 15 },
    'ribera del duero': { minAge: 4, maxAge: 18 },
    'napa valley': { minAge: 5, maxAge: 20 },
    'sonoma': { minAge: 3, maxAge: 12 },
    'willamette valley': { minAge: 3, maxAge: 10 },
    'barossa valley': { minAge: 4, maxAge: 15 },
    'margaret river': { minAge: 4, maxAge: 15 },
    'marlborough': { minAge: 1, maxAge: 3 },
    'central otago': { minAge: 3, maxAge: 10 },
    'mendoza': { minAge: 3, maxAge: 10 },
    'stellenbosch': { minAge: 3, maxAge: 12 },
    'douro valley': { minAge: 5, maxAge: 20 },
    'mosel': { minAge: 3, maxAge: 20 },
    'wachau': { minAge: 2, maxAge: 10 },
    'niagara peninsula': { minAge: 2, maxAge: 7 },
    'okanagan valley': { minAge: 2, maxAge: 8 },
    'prince edward county': { minAge: 2, maxAge: 7 },
  },
  // By classification (adjusts the window upward)
  classifications: {
    'grand cru': { adjust: 1.5 },
    'premier cru': { adjust: 1.3 },
    '1er cru': { adjust: 1.3 },
    'cru classé': { adjust: 1.3 },
    'gran reserva': { adjust: 1.4 },
    'reserva': { adjust: 1.2 },
    'riserva': { adjust: 1.3 },
    'superiore': { adjust: 1.1 },
  },
  // Vintage quality adjustments for Bordeaux (well-documented)
  vintageQuality: {
    'bordeaux': {
      2022: { quality: 'excellent', adjust: 1.1 },
      2020: { quality: 'exceptional', adjust: 1.2 },
      2019: { quality: 'exceptional', adjust: 1.2 },
      2018: { quality: 'excellent', adjust: 1.15 },
      2016: { quality: 'exceptional', adjust: 1.25 },
      2015: { quality: 'excellent', adjust: 1.2 },
      2014: { quality: 'good', adjust: 1.0 },
      2012: { quality: 'good', adjust: 0.9 },
      2010: { quality: 'exceptional', adjust: 1.3 },
      2009: { quality: 'exceptional', adjust: 1.25 },
      2005: { quality: 'exceptional', adjust: 1.3 },
      2000: { quality: 'excellent', adjust: 1.2 },
    },
    'burgundy': {
      2020: { quality: 'excellent', adjust: 1.15 },
      2019: { quality: 'excellent', adjust: 1.15 },
      2018: { quality: 'good', adjust: 1.0 },
      2017: { quality: 'good', adjust: 0.95 },
      2016: { quality: 'good', adjust: 1.0 },
      2015: { quality: 'exceptional', adjust: 1.2 },
      2010: { quality: 'excellent', adjust: 1.2 },
      2009: { quality: 'good', adjust: 1.0 },
      2005: { quality: 'exceptional', adjust: 1.25 },
    },
    'napa valley': {
      2021: { quality: 'excellent', adjust: 1.1 },
      2019: { quality: 'excellent', adjust: 1.15 },
      2018: { quality: 'exceptional', adjust: 1.2 },
      2016: { quality: 'exceptional', adjust: 1.2 },
      2015: { quality: 'excellent', adjust: 1.15 },
      2014: { quality: 'excellent', adjust: 1.1 },
      2013: { quality: 'excellent', adjust: 1.15 },
      2012: { quality: 'exceptional', adjust: 1.2 },
    },
    'tuscany': {
      2019: { quality: 'excellent', adjust: 1.15 },
      2016: { quality: 'exceptional', adjust: 1.2 },
      2015: { quality: 'exceptional', adjust: 1.2 },
      2010: { quality: 'exceptional', adjust: 1.25 },
      2006: { quality: 'excellent', adjust: 1.1 },
    },
    'piedmont': {
      2019: { quality: 'excellent', adjust: 1.1 },
      2016: { quality: 'exceptional', adjust: 1.25 },
      2015: { quality: 'good', adjust: 1.0 },
      2014: { quality: 'good', adjust: 0.95 },
      2013: { quality: 'exceptional', adjust: 1.2 },
      2010: { quality: 'exceptional', adjust: 1.3 },
    },
    'rioja': {
      2019: { quality: 'good', adjust: 1.0 },
      2018: { quality: 'excellent', adjust: 1.15 },
      2016: { quality: 'excellent', adjust: 1.15 },
      2015: { quality: 'good', adjust: 1.0 },
      2014: { quality: 'good', adjust: 1.0 },
      2011: { quality: 'excellent', adjust: 1.15 },
      2010: { quality: 'exceptional', adjust: 1.2 },
      2005: { quality: 'exceptional', adjust: 1.2 },
      2004: { quality: 'excellent', adjust: 1.15 },
      2001: { quality: 'exceptional', adjust: 1.2 },
    },
  },
};

/**
 * Calculate expert drinking window for a wine based on grape, region, vintage, and classification.
 * Returns { from, to, confidence, source } or null.
 */
export function getExpertDrinkingWindow(wine) {
  const vintage = parseInt(wine.vintage);
  if (!vintage || vintage < 1950) return null;

  let minAge = 2;
  let maxAge = 8;
  let confidence = 'low';
  let source = 'general estimate';

  const nameLower = ((wine.name || '') + ' ' + (wine.producer || '')).toLowerCase();
  const regionLower = (wine.region || '').toLowerCase();
  const grapes = (wine.grapeVarieties || []).map((g) => g.toLowerCase());
  const classLower = (wine.classification || '').toLowerCase();

  // 1. Check specific wine names (highest confidence)
  for (const [name, window] of Object.entries(DRINKING_WINDOWS.specific)) {
    if (nameLower.includes(name)) {
      minAge = window.minAge;
      maxAge = window.maxAge;
      confidence = 'high';
      source = `expert reviews for ${name}`;
      break;
    }
  }

  // 2. Match by region (if no specific match)
  if (confidence !== 'high') {
    for (const [region, window] of Object.entries(DRINKING_WINDOWS.regions)) {
      if (regionLower.includes(region) || region.includes(regionLower)) {
        minAge = window.minAge;
        maxAge = window.maxAge;
        confidence = 'medium';
        source = `${region} regional guidelines`;
        break;
      }
    }
  }

  // 3. Refine by grape variety
  for (const grape of grapes) {
    for (const [grapeKey, window] of Object.entries(DRINKING_WINDOWS.grapes)) {
      if (grape.includes(grapeKey) || grapeKey.includes(grape)) {
        if (confidence !== 'high') {
          // Blend region and grape windows
          minAge = Math.round((minAge + window.minAge) / 2);
          maxAge = Math.round((maxAge + window.maxAge) / 2);
          confidence = confidence === 'medium' ? 'medium' : 'low';
          source = source.includes('regional') ? source : `${grapeKey} typical aging`;
        }
        break;
      }
    }
  }

  // 4. Adjust for classification
  for (const [cls, { adjust }] of Object.entries(DRINKING_WINDOWS.classifications)) {
    if (classLower.includes(cls)) {
      maxAge = Math.round(maxAge * adjust);
      if (adjust > 1.2) minAge = Math.round(minAge * 1.2);
      source += ` (${cls} adjusted)`;
      if (confidence === 'low') confidence = 'medium';
      break;
    }
  }

  // 5. Adjust for vintage quality (region-specific)
  for (const [region, vintages] of Object.entries(DRINKING_WINDOWS.vintageQuality)) {
    if (regionLower.includes(region)) {
      const vintageData = vintages[vintage];
      if (vintageData) {
        maxAge = Math.round(maxAge * vintageData.adjust);
        if (vintageData.adjust > 1.15) minAge = Math.round(minAge * 1.1);
        confidence = 'high';
        source = `${region} ${vintage} (${vintageData.quality} vintage) expert consensus`;
      }
      break;
    }
  }

  return {
    from: vintage + minAge,
    to: vintage + maxAge,
    confidence,
    source,
  };
}

/**
 * Look up food pairings, tasting notes, and drinking window for a wine.
 * Combines cached data, expert knowledge base, and web fetches.
 */
export async function lookupWineData(wine) {
  const cacheKey = buildCacheKey(wine);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const result = {
    foodPairings: [],
    tastingNotes: '',
    drinkingWindow: null,
    source: 'expert-database',
  };

  // 0. Calculate expert drinking window
  const window = getExpertDrinkingWindow(wine);
  if (window) {
    result.drinkingWindow = window;
  }

  // 1. Match by grape varieties
  const grapes = (wine.grapeVarieties || []).map((g) => g.toLowerCase());
  for (const grape of grapes) {
    for (const [key, data] of Object.entries(EXPERT_PAIRINGS.grapes)) {
      if (grape.includes(key) || key.includes(grape)) {
        result.foodPairings.push(...data.pairings);
        if (!result.tastingNotes) result.tastingNotes = data.notes;
        break;
      }
    }
  }

  // 2. Match by region
  const region = (wine.region || '').toLowerCase();
  for (const [key, data] of Object.entries(EXPERT_PAIRINGS.regions)) {
    if (region.includes(key) || key.includes(region)) {
      result.foodPairings.push(...data.pairings);
      if (!result.tastingNotes && data.notes) {
        result.tastingNotes = (result.tastingNotes ? result.tastingNotes + ' ' : '') + data.notes;
      }
      break;
    }
  }

  // 3. Try web fetch for additional data
  try {
    const webData = await fetchFromWeb(wine);
    if (webData) {
      if (webData.pairings?.length) {
        result.foodPairings.push(...webData.pairings);
      }
      if (webData.tastingNotes) {
        result.tastingNotes = webData.tastingNotes;
        result.source = 'web';
      }
    }
  } catch { /* use expert data */ }

  // Deduplicate pairings
  result.foodPairings = [...new Set(result.foodPairings)];

  // Cache the result
  setCache(cacheKey, result);

  return result;
}

async function fetchFromWeb(wine) {
  const searchTerms = [wine.name, wine.producer, wine.vintage, 'food pairing tasting notes']
    .filter(Boolean)
    .join(' ');

  // Try the Open Library wine API or similar free sources
  try {
    const resp = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://www.google.com/search?q=${encodeURIComponent(searchTerms)}&num=3`
      )}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (resp.ok) {
      const html = await resp.text();
      return extractWineInfo(html);
    }
  } catch { /* timeout or blocked */ }

  return null;
}

function extractWineInfo(html) {
  const result = { pairings: [], tastingNotes: '' };

  // Extract food pairing mentions
  const foodTerms = [
    'steak', 'lamb', 'beef', 'pork', 'chicken', 'duck', 'fish', 'salmon',
    'lobster', 'shrimp', 'cheese', 'pasta', 'risotto', 'mushroom', 'truffle',
    'chocolate', 'dessert', 'oyster', 'sushi', 'curry', 'pizza',
  ];

  const pairingPattern = /pair[s]?\s+(?:well\s+)?(?:with|alongside)\s+([^.<]+)/gi;
  const matches = html.matchAll(pairingPattern);
  for (const match of matches) {
    if (match[1] && match[1].length < 100) {
      result.pairings.push(match[1].trim());
    }
  }

  // Extract tasting note phrases
  const notePattern = /(?:notes?\s+of|aromas?\s+of|flavou?rs?\s+of|palate\s+shows?)\s+([^.<]+)/gi;
  const noteMatches = html.matchAll(notePattern);
  const notes = [];
  for (const match of noteMatches) {
    if (match[1] && match[1].length < 150) {
      notes.push(match[1].trim());
    }
  }
  if (notes.length) {
    result.tastingNotes = notes.slice(0, 3).join('. ') + '.';
  }

  return result;
}

/**
 * Get quick food pairing suggestions based on wine type and grapes.
 * Synchronous, uses only the expert database.
 */
export function getExpertPairings(wine) {
  const pairings = new Set();
  const notes = [];

  // By grape
  const grapes = (wine.grapeVarieties || []).map((g) => g.toLowerCase());
  for (const grape of grapes) {
    for (const [key, data] of Object.entries(EXPERT_PAIRINGS.grapes)) {
      if (grape.includes(key) || key.includes(grape)) {
        data.pairings.forEach((p) => pairings.add(p));
        notes.push(data.notes);
      }
    }
  }

  // By region
  const region = (wine.region || '').toLowerCase();
  for (const [key, data] of Object.entries(EXPERT_PAIRINGS.regions)) {
    if (region.includes(key) || key.includes(region)) {
      data.pairings.forEach((p) => pairings.add(p));
      notes.push(data.notes);
    }
  }

  return {
    pairings: [...pairings],
    tastingNotes: notes.join(' '),
  };
}
