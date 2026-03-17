// Wine type metadata, food pairings suggestions, and drinking window heuristics

export const WINE_TYPES = [
  { value: 'red', label: 'Red', emoji: '\uD83D\uDFE5', color: 'bg-red-800' },
  { value: 'white', label: 'White', emoji: '\uD83D\uDFE8', color: 'bg-yellow-200' },
  { value: 'rose', label: 'Ros\u00e9', emoji: '\uD83C\uDF38', color: 'bg-pink-300' },
  { value: 'sparkling', label: 'Sparkling', emoji: '\uD83C\uDF7E', color: 'bg-amber-100' },
  { value: 'dessert', label: 'Dessert', emoji: '\uD83C\uDF6F', color: 'bg-amber-400' },
  { value: 'fortified', label: 'Fortified', emoji: '\uD83C\uDFFA', color: 'bg-amber-700' },
  { value: 'orange', label: 'Orange', emoji: '\uD83C\uDF4A', color: 'bg-orange-300' },
];

export const COMMON_GRAPES = {
  red: ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah/Shiraz', 'Malbec', 'Tempranillo', 'Sangiovese', 'Nebbiolo', 'Grenache', 'Zinfandel', 'Cabernet Franc', 'Gamay', 'Mourvèdre', 'Petit Verdot', 'Carménère', 'Pinotage'],
  white: ['Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Pinot Grigio/Gris', 'Gewürztraminer', 'Viognier', 'Chenin Blanc', 'Sémillon', 'Albariño', 'Grüner Veltliner', 'Marsanne', 'Roussanne', 'Torrontés', 'Muscadet'],
  rose: ['Grenache', 'Syrah', 'Mourvèdre', 'Cinsault', 'Pinot Noir', 'Sangiovese'],
  sparkling: ['Chardonnay', 'Pinot Noir', 'Pinot Meunier', 'Glera (Prosecco)', 'Xarel·lo', 'Macabeo'],
};

export const FOOD_PAIRING_SUGGESTIONS = {
  red: [
    'Grilled Steak', 'Lamb Chops', 'Beef Stew', 'Roast Duck', 'Aged Cheese',
    'Mushroom Risotto', 'BBQ Ribs', 'Pasta Bolognese', 'Venison', 'Dark Chocolate',
    'Charcuterie', 'Braised Short Ribs', 'Pizza Margherita', 'Eggplant Parmesan',
  ],
  white: [
    'Grilled Fish', 'Roast Chicken', 'Lobster', 'Caesar Salad', 'Oysters',
    'Goat Cheese', 'Sushi', 'Thai Curry', 'Risotto', 'Crab Cakes',
    'Shrimp Scampi', 'Quiche', 'Brie', 'Pad Thai',
  ],
  rose: [
    'Mediterranean Salad', 'Grilled Shrimp', 'Bruschetta', 'Tapas', 'Seared Tuna',
    'Caprese Salad', 'Charcuterie', 'Light Pasta', 'Grilled Vegetables',
  ],
  sparkling: [
    'Oysters', 'Caviar', 'Fried Chicken', 'Popcorn', 'Sushi',
    'Smoked Salmon', 'Strawberries', 'Brunch', 'Soft Cheese',
  ],
  dessert: [
    'Crème Brûlée', 'Blue Cheese', 'Foie Gras', 'Fruit Tart', 'Tiramisu',
    'Apple Pie', 'Panna Cotta', 'Chocolate Mousse',
  ],
  fortified: [
    'Nuts', 'Dark Chocolate', 'Stilton', 'Dried Fruit', 'Caramel Desserts',
    'Roquefort', 'Crème Caramel',
  ],
  orange: [
    'Moroccan Tagine', 'Korean BBQ', 'Aged Cheese', 'Charcuterie',
    'Roasted Root Vegetables', 'Curry', 'Grilled Octopus',
  ],
};

export const REGIONS = [
  'Bordeaux', 'Burgundy', 'Champagne', 'Loire Valley', 'Rhône Valley', 'Alsace', 'Languedoc',
  'Tuscany', 'Piedmont', 'Veneto', 'Sicily',
  'Rioja', 'Ribera del Duero', 'Priorat',
  'Napa Valley', 'Sonoma', 'Willamette Valley', 'Finger Lakes', 'Paso Robles',
  'Niagara Peninsula', 'Okanagan Valley', 'Prince Edward County',
  'Barossa Valley', 'Margaret River', 'Hunter Valley', 'McLaren Vale',
  'Marlborough', 'Central Otago', 'Hawke\'s Bay',
  'Mendoza', 'Stellenbosch', 'Douro Valley', 'Mosel', 'Wachau',
];

export const COUNTRIES = [
  'France', 'Italy', 'Spain', 'Portugal', 'Germany', 'Austria',
  'USA', 'Canada', 'Argentina', 'Chile',
  'Australia', 'New Zealand', 'South Africa',
  'Greece', 'Hungary', 'Georgia', 'Lebanon', 'Israel',
];

// Generate a rough drinking window estimate based on wine type and grape
export function estimateDrinkingWindow(wine) {
  const vintage = wine.vintage;
  if (!vintage) return null;

  const type = wine.type;
  const grapes = (wine.grapeVarieties || []).map(g => g.toLowerCase());
  const region = (wine.region || '').toLowerCase();

  let minAge = 1;
  let maxAge = 5;

  if (type === 'red') {
    minAge = 2; maxAge = 8;
    if (grapes.some(g => g.includes('cabernet') || g.includes('nebbiolo') || g.includes('syrah'))) {
      minAge = 5; maxAge = 20;
    }
    if (region.includes('bordeaux') || region.includes('barolo') || region.includes('brunello')) {
      minAge = 7; maxAge = 25;
    }
    if (grapes.some(g => g.includes('pinot noir') || g.includes('gamay'))) {
      minAge = 2; maxAge = 10;
    }
  } else if (type === 'white') {
    minAge = 1; maxAge = 3;
    if (grapes.some(g => g.includes('riesling') || g.includes('chenin') || g.includes('chardonnay'))) {
      minAge = 2; maxAge = 10;
    }
    if (region.includes('burgundy') || region.includes('alsace')) {
      minAge = 3; maxAge = 15;
    }
  } else if (type === 'sparkling') {
    minAge = 0; maxAge = 3;
    if (region.includes('champagne')) {
      minAge = 1; maxAge = 10;
    }
  } else if (type === 'dessert' || type === 'fortified') {
    minAge = 1; maxAge = 30;
  }

  return {
    from: vintage + minAge,
    to: vintage + maxAge,
  };
}

// Build an LCBO search URL for a given wine
export function buildLCBOSearchUrl(wine) {
  const terms = [wine.name, wine.producer, wine.region].filter(Boolean).join(' ');
  return `https://www.lcbo.com/en/search?searchTerm=${encodeURIComponent(terms)}`;
}

export function buildVintagesSearchUrl(wine) {
  const terms = [wine.name, wine.producer, wine.region].filter(Boolean).join(' ');
  return `https://www.vintages.com/search/?q=${encodeURIComponent(terms)}`;
}

// Suggest similar wines based on type, region, and grapes
export function getSimilarWineSearchTerms(wine) {
  const suggestions = [];
  if (wine.grapeVarieties?.length) {
    suggestions.push(...wine.grapeVarieties.slice(0, 2));
  }
  if (wine.region) suggestions.push(wine.region);
  if (wine.type) suggestions.push(wine.type);
  return suggestions;
}
