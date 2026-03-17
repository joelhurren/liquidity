import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'wine-cellar-data';

const defaultData = {
  wines: [],
  version: 1,
};

export function loadCellar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    return JSON.parse(raw);
  } catch {
    return { ...defaultData };
  }
}

export function saveCellar(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addWine(wine) {
  const cellar = loadCellar();
  const newWine = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Core info
    name: wine.name || '',
    producer: wine.producer || '',
    vintage: wine.vintage || null,
    region: wine.region || '',
    country: wine.country || '',
    appellation: wine.appellation || '',
    grapeVarieties: wine.grapeVarieties || [],
    type: wine.type || 'red', // red, white, rose, sparkling, dessert, fortified, orange
    color: wine.color || '',
    // Inventory
    bottles: wine.bottles ?? 1,
    purchasePrice: wine.purchasePrice || null,
    purchaseDate: wine.purchaseDate || null,
    purchaseLocation: wine.purchaseLocation || '',
    // Drinking window
    drinkFrom: wine.drinkFrom || null,
    drinkTo: wine.drinkTo || null,
    // Ratings & Notes
    rating: wine.rating || null, // 1-100 or 1-5 stars
    reviews: wine.reviews || [],
    tastingNotes: wine.tastingNotes || '',
    // Food pairings
    foodPairings: wine.foodPairings || [],
    // Image
    imageData: wine.imageData || null,
    // Extra
    alcoholPercent: wine.alcoholPercent || null,
    classification: wine.classification || '',
    storageLocation: wine.storageLocation || '',
  };
  cellar.wines.push(newWine);
  saveCellar(cellar);
  return newWine;
}

export function updateWine(id, updates) {
  const cellar = loadCellar();
  const idx = cellar.wines.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  cellar.wines[idx] = { ...cellar.wines[idx], ...updates, updatedAt: new Date().toISOString() };
  saveCellar(cellar);
  return cellar.wines[idx];
}

export function deleteWine(id) {
  const cellar = loadCellar();
  cellar.wines = cellar.wines.filter((w) => w.id !== id);
  saveCellar(cellar);
}

export function getWine(id) {
  const cellar = loadCellar();
  return cellar.wines.find((w) => w.id === id) || null;
}

export function getAllWines() {
  return loadCellar().wines;
}

export function addReview(wineId, review) {
  const cellar = loadCellar();
  const wine = cellar.wines.find((w) => w.id === wineId);
  if (!wine) return null;
  const newReview = {
    id: uuidv4(),
    date: new Date().toISOString(),
    rating: review.rating || null,
    notes: review.notes || '',
    occasion: review.occasion || '',
  };
  wine.reviews.push(newReview);
  wine.updatedAt = new Date().toISOString();
  saveCellar(cellar);
  return newReview;
}

export function adjustBottles(wineId, delta) {
  const cellar = loadCellar();
  const wine = cellar.wines.find((w) => w.id === wineId);
  if (!wine) return null;
  wine.bottles = Math.max(0, wine.bottles + delta);
  wine.updatedAt = new Date().toISOString();
  saveCellar(cellar);
  return wine;
}
