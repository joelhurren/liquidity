// Wine lookup service — calls Supabase Edge Function powered by Claude AI

import { supabase } from '../lib/supabase';

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

/**
 * Look up wine data using the AI-powered edge function.
 * Returns: { producer, region, country, appellation, type, grapeVarieties,
 *            classification, alcoholPercent, foodPairings, tastingNotes,
 *            drinkFrom, drinkTo }
 */
export async function lookupWineData(wine) {
  const cacheKey = buildCacheKey(wine);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!supabase) {
    return { foodPairings: [], tastingNotes: '', source: 'offline' };
  }

  const { data, error } = await supabase.functions.invoke('wine-lookup', {
    body: {
      name: wine.name,
      producer: wine.producer,
      vintage: wine.vintage,
      region: wine.region,
      type: wine.type,
      grapeVarieties: wine.grapeVarieties,
    },
  });

  if (error) {
    console.error('Wine lookup failed:', error);
    throw new Error('Wine lookup failed');
  }

  const result = {
    producer: data.producer || null,
    region: data.region || null,
    country: data.country || null,
    appellation: data.appellation || null,
    type: data.type || null,
    grapeVarieties: data.grapeVarieties || [],
    classification: data.classification || null,
    alcoholPercent: data.alcoholPercent || null,
    foodPairings: data.foodPairings || [],
    tastingNotes: data.tastingNotes || '',
    drinkFrom: data.drinkFrom || null,
    drinkTo: data.drinkTo || null,
    source: 'ai',
  };

  setCache(cacheKey, result);
  return result;
}

// Static expert pairings for offline/sync use (used by SuggestWine)
const EXPERT_PAIRINGS = {
  grapes: {
    'cabernet sauvignon': { pairings: ['Grilled Ribeye Steak', 'Braised Short Ribs', 'Lamb Rack with Rosemary', 'Aged Gouda', 'Mushroom Risotto', 'Beef Wellington'], notes: 'Full-bodied with blackcurrant, cedar, and tobacco.' },
    'merlot': { pairings: ['Roast Duck Breast', 'Beef Bourguignon', 'Pork Tenderloin', 'Brie & Camembert', 'Mushroom Pasta'], notes: 'Medium to full-bodied with plum, cherry, and chocolate.' },
    'pinot noir': { pairings: ['Salmon with Herbs', 'Duck Confit', 'Coq au Vin', 'Gruyère Cheese', 'Roasted Chicken'], notes: 'Light to medium-bodied with red fruit, earth, and spice.' },
    'syrah': { pairings: ['BBQ Brisket', 'Lamb Tagine', 'Wild Boar Ragu', 'Smoked Gouda', 'Grilled Sausages'], notes: 'Full-bodied with dark fruit, pepper, and smoke.' },
    'shiraz': { pairings: ['BBQ Ribs', 'Lamb Shoulder', 'Aged Cheddar', 'Pepper Steak', 'Dark Chocolate'], notes: 'Bold and fruit-forward with blackberry, licorice, and spice.' },
    'nebbiolo': { pairings: ['Osso Buco', 'White Truffle Pasta', 'Braised Veal', 'Parmigiano-Reggiano', 'Risotto al Barolo'], notes: 'Full-bodied with rose, tar, cherry, and earth.' },
    'sangiovese': { pairings: ['Pasta Bolognese', 'Margherita Pizza', 'Bistecca Fiorentina', 'Pecorino Toscano', 'Lasagna'], notes: 'Medium-bodied with cherry, tomato, and herbs.' },
    'tempranillo': { pairings: ['Ibérico Ham', 'Chorizo & Manchego', 'Lamb Chops', 'Paella', 'Roast Suckling Pig'], notes: 'Medium to full-bodied with cherry, leather, and vanilla.' },
    'malbec': { pairings: ['Argentine Steak', 'Chimichurri Chicken', 'Empanadas', 'Smoked Brisket', 'Black Bean Chili'], notes: 'Full-bodied with plum, blackberry, and violet.' },
    'chardonnay': { pairings: ['Lobster Thermidor', 'Roast Chicken', 'Crab Cakes', 'Triple Cream Brie', 'Scallops with Butter'], notes: 'Medium to full-bodied white with butter, vanilla, or citrus.' },
    'sauvignon blanc': { pairings: ['Goat Cheese Salad', 'Grilled Asparagus', 'Ceviche', 'Oysters', 'Herb-Crusted Fish'], notes: 'Crisp and aromatic with grapefruit, herbs, and minerality.' },
    'riesling': { pairings: ['Spicy Thai Curry', 'Peking Duck', 'Pork Schnitzel', 'Sashimi', 'Indian Tikka Masala'], notes: 'Light-bodied with stone fruit, citrus, and petrol.' },
  },
  regions: {
    'bordeaux': { pairings: ['Entrecôte Bordelaise', 'Lamb with Flageolet Beans', 'Duck Confit', 'Comté Cheese'], notes: 'Structured with cassis, graphite, and cedar.' },
    'burgundy': { pairings: ['Boeuf Bourguignon', 'Époisses Cheese', 'Escargot', 'Coq au Vin'], notes: 'Pinot Noir reds with cherry, earth, and mushroom.' },
    'tuscany': { pairings: ['Bistecca Fiorentina', 'Wild Boar Pappardelle', 'Ribollita', 'Pecorino with Honey'], notes: 'Sangiovese-based with cherry, leather, and Italian herbs.' },
    'napa valley': { pairings: ['Prime Ribeye', 'Truffle Mac & Cheese', 'Grilled Portobello', 'Filet Mignon'], notes: 'Bold Cabernet Sauvignon with blackcurrant, mocha, and vanilla.' },
    'champagne': { pairings: ['Oysters', 'Caviar', 'Fried Chicken', 'Smoked Salmon Blini'], notes: 'Sparkling with brioche, citrus, and fine bubbles.' },
  },
};

export function getExpertPairings(wine) {
  const pairings = new Set();
  const notes = [];

  const grapes = (wine.grapeVarieties || []).map((g) => g.toLowerCase());
  for (const grape of grapes) {
    for (const [key, data] of Object.entries(EXPERT_PAIRINGS.grapes)) {
      if (grape.includes(key) || key.includes(grape)) {
        data.pairings.forEach((p) => pairings.add(p));
        notes.push(data.notes);
      }
    }
  }

  const region = (wine.region || '').toLowerCase();
  for (const [key, data] of Object.entries(EXPERT_PAIRINGS.regions)) {
    if (region.includes(key) || key.includes(region)) {
      data.pairings.forEach((p) => pairings.add(p));
      notes.push(data.notes);
    }
  }

  return { pairings: [...pairings], tastingNotes: notes.join(' ') };
}
