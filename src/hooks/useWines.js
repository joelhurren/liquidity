import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { uploadWineImage, isBase64Image, deleteWineImage } from '../lib/imageStorage';

// ─── localStorage helpers (offline fallback) ───
const STORAGE_KEY = 'wine-cellar-data';

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).wines || [] : [];
  } catch {
    return [];
  }
}

function saveLocal(wines) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ wines, version: 1 }));
}

// ─── Convert between JS camelCase ↔ Supabase snake_case ───
function toSnake(wine) {
  return {
    name: wine.name || '',
    producer: wine.producer || '',
    vintage: wine.vintage || null,
    region: wine.region || '',
    country: wine.country || '',
    appellation: wine.appellation || '',
    grape_varieties: wine.grapeVarieties || [],
    type: wine.type || 'red',
    color: wine.color || '',
    bottles: wine.bottles ?? 1,
    purchase_price: wine.purchasePrice || null,
    purchase_date: wine.purchaseDate || null,
    purchase_location: wine.purchaseLocation || '',
    drink_from: wine.drinkFrom || null,
    drink_to: wine.drinkTo || null,
    rating: wine.rating || null,
    reviews: wine.reviews || [],
    tasting_notes: wine.tastingNotes || '',
    food_pairings: wine.foodPairings || [],
    image_data: wine.imageData || null,
    alcohol_percent: wine.alcoholPercent || null,
    classification: wine.classification || '',
    storage_location: wine.storageLocation || '',
    critic_scores: wine.criticScores || [],
    community_score: wine.communityScore || null,
    community_ratings: wine.communityRatings || null,
    quality_percentile: wine.qualityPercentile || null,
    vivino_url: wine.vivinoUrl || null,
  };
}

function toCamel(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name || '',
    producer: row.producer || '',
    vintage: row.vintage,
    region: row.region || '',
    country: row.country || '',
    appellation: row.appellation || '',
    grapeVarieties: row.grape_varieties || [],
    type: row.type || 'red',
    color: row.color || '',
    bottles: row.bottles ?? 1,
    purchasePrice: row.purchase_price,
    purchaseDate: row.purchase_date,
    purchaseLocation: row.purchase_location || '',
    drinkFrom: row.drink_from,
    drinkTo: row.drink_to,
    rating: row.rating,
    reviews: row.reviews || [],
    tastingNotes: row.tasting_notes || '',
    foodPairings: row.food_pairings || [],
    imageData: row.image_data,
    alcoholPercent: row.alcohol_percent,
    classification: row.classification || '',
    storageLocation: row.storage_location || '',
    criticScores: row.critic_scores || [],
    communityScore: row.community_score || null,
    communityRatings: row.community_ratings || null,
    qualityPercentile: row.quality_percentile || null,
    vivinoUrl: row.vivino_url || null,
  };
}

// ─── Main hook ───
export function useWines() {
  const { user, isOfflineMode } = useAuth();
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load wines
  const refresh = useCallback(async () => {
    if (isOfflineMode || !supabase || !user) {
      setWines(loadLocal());
      setLoading(false);
      return;
    }

    try {
      // Exclude image_data from list query — base64 images are huge and only needed on detail page
      const { data, error } = await supabase
        .from('wines')
        .select('id,created_at,updated_at,name,producer,vintage,region,country,appellation,grape_varieties,type,color,bottles,purchase_price,purchase_date,purchase_location,drink_from,drink_to,rating,reviews,tasting_notes,food_pairings,alcohol_percent,classification,storage_location,critic_scores,community_score,community_ratings,quality_percentile,vivino_url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWines((data || []).map(toCamel));
    } catch (err) {
      console.error('Failed to load wines from Supabase, falling back to local:', err);
      setWines(loadLocal());
    } finally {
      setLoading(false);
    }
  }, [user, isOfflineMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Add wine
  const addWine = useCallback(async (wine) => {
    if (isOfflineMode || !supabase || !user) {
      const newWine = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...wine,
        bottles: wine.bottles ?? 1,
        reviews: wine.reviews || [],
        grapeVarieties: wine.grapeVarieties || [],
        foodPairings: wine.foodPairings || [],
      };
      const updated = [newWine, ...loadLocal()];
      saveLocal(updated);
      setWines(updated);
      return newWine;
    }

    const base64Image = isBase64Image(wine.imageData) ? wine.imageData : null;
    const snakeData = { ...toSnake(wine), user_id: user.id };
    if (base64Image) snakeData.image_data = null; // don't store base64 in DB

    const { data, error } = await supabase
      .from('wines')
      .insert(snakeData)
      .select()
      .single();

    if (error) throw error;

    // Upload image to storage using the real wine ID
    if (base64Image) {
      const imageUrl = await uploadWineImage(base64Image, data.id);
      if (imageUrl) {
        await supabase.from('wines').update({ image_data: imageUrl }).eq('id', data.id);
        data.image_data = imageUrl;
      }
    }

    const camel = toCamel(data);
    setWines(prev => [camel, ...prev]);
    return camel;
  }, [user, isOfflineMode]);

  // Update wine
  const updateWine = useCallback(async (id, updates) => {
    if (isOfflineMode || !supabase || !user) {
      const local = loadLocal();
      const idx = local.findIndex(w => w.id === id);
      if (idx === -1) return null;
      local[idx] = { ...local[idx], ...updates, updatedAt: new Date().toISOString() };
      saveLocal(local);
      setWines([...local]);
      return local[idx];
    }

    const snakeUpdates = {};
    const fieldMap = {
      name: 'name', producer: 'producer', vintage: 'vintage', region: 'region',
      country: 'country', appellation: 'appellation', grapeVarieties: 'grape_varieties',
      type: 'type', color: 'color', bottles: 'bottles', purchasePrice: 'purchase_price',
      purchaseDate: 'purchase_date', purchaseLocation: 'purchase_location',
      drinkFrom: 'drink_from', drinkTo: 'drink_to', rating: 'rating', reviews: 'reviews',
      tastingNotes: 'tasting_notes', foodPairings: 'food_pairings', imageData: 'image_data',
      alcoholPercent: 'alcohol_percent', classification: 'classification',
      storageLocation: 'storage_location', criticScores: 'critic_scores',
      communityScore: 'community_score', communityRatings: 'community_ratings',
      qualityPercentile: 'quality_percentile', vivinoUrl: 'vivino_url',
    };
    for (const [key, val] of Object.entries(updates)) {
      if (fieldMap[key]) snakeUpdates[fieldMap[key]] = val;
    }

    // Upload image to storage if it's base64
    if (isBase64Image(snakeUpdates.image_data)) {
      const imageUrl = await uploadWineImage(snakeUpdates.image_data, id);
      snakeUpdates.image_data = imageUrl || snakeUpdates.image_data;
    }

    const { data, error } = await supabase
      .from('wines')
      .update(snakeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const camel = toCamel(data);
    setWines(prev => prev.map(w => w.id === id ? camel : w));
    return camel;
  }, [user, isOfflineMode]);

  // Delete wine
  const deleteWine = useCallback(async (id) => {
    if (isOfflineMode || !supabase || !user) {
      const local = loadLocal().filter(w => w.id !== id);
      saveLocal(local);
      setWines(local);
      return;
    }

    const { error } = await supabase
      .from('wines')
      .delete()
      .eq('id', id);

    if (error) throw error;
    deleteWineImage(id); // fire-and-forget cleanup
    setWines(prev => prev.filter(w => w.id !== id));
  }, [user, isOfflineMode]);

  // Get single wine (full data including imageData)
  const getWine = useCallback(async (id) => {
    if (isOfflineMode || !supabase || !user) {
      return loadLocal().find(w => w.id === id) || null;
    }

    // Fetch full row (including image_data) for the detail page
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    const full = toCamel(data);
    // Update in-memory list with full data so subsequent lookups are instant
    setWines(prev => prev.map(w => w.id === id ? full : w));
    return full;
  }, [user, isOfflineMode]);

  // Add review to a wine
  const addReview = useCallback(async (wineId, review) => {
    const wine = wines.find(w => w.id === wineId);
    if (!wine) return null;

    const newReview = {
      id: uuidv4(),
      date: new Date().toISOString(),
      rating: review.rating || null,
      notes: review.notes || '',
      occasion: review.occasion || '',
    };

    const updatedReviews = [...(wine.reviews || []), newReview];
    await updateWine(wineId, { reviews: updatedReviews });
    return newReview;
  }, [wines, updateWine]);

  // Adjust bottle count
  const adjustBottles = useCallback(async (wineId, delta) => {
    const wine = wines.find(w => w.id === wineId);
    if (!wine) return null;

    const newCount = Math.max(0, (wine.bottles || 0) + delta);
    return await updateWine(wineId, { bottles: newCount });
  }, [wines, updateWine]);

  return {
    wines,
    loading,
    addWine,
    updateWine,
    deleteWine,
    getWine,
    addReview,
    adjustBottles,
    refresh,
  };
}
