import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Trash2, Plus, Minus, Wine, ExternalLink,
  UtensilsCrossed, Calendar, MapPin, Grape, Tag, Percent,
  Sparkles, Search, ShoppingCart, Clock, Globe, Loader2, GlassWater, MapPinned,
} from 'lucide-react';
import { useWines } from '../hooks/useWines';
import { WINE_TYPES, FOOD_PAIRING_SUGGESTIONS, buildLCBOSearchUrl, getSimilarWineSearchTerms } from '../data/wineData';
import { lookupWineData } from '../data/wineLookup';
import { getWineScores } from '../data/wineScores';
import StarRating from '../components/StarRating';
import WineBottle from '../components/WineBottle';
import DrinkingWindow from '../components/DrinkingWindow';
import WineTypeIcon from '../components/WineTypeIcon';

export default function WineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getWine, updateWine, deleteWine, adjustBottles, addReview } = useWines();
  const [wine, setWine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: null, notes: '', occasion: '' });
  const [showDrankConfirm, setShowDrankConfirm] = useState(false);
  const [drankSuccess, setDrankSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const w = await getWine(id);
      if (cancelled) return;
      if (!w) navigate('/');
      else setWine(w);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, navigate, getWine]);

  if (loading || !wine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-4 border-burgundy border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleAdjustBottles = async (delta) => {
    const updated = await adjustBottles(wine.id, delta);
    if (updated) setWine({ ...updated });
  };

  const handleDrankBottle = async () => {
    if (wine.bottles <= 0) return;
    const updated = await adjustBottles(wine.id, -1);
    if (updated) {
      const review = {
        rating: null,
        notes: '',
        occasion: 'Opened a bottle',
        date: new Date().toISOString(),
      };
      await addReview(wine.id, review);
      // Refresh wine data
      const refreshed = await getWine(wine.id);
      setWine(refreshed || updated);
      setShowDrankConfirm(false);
      setDrankSuccess(true);
      setTimeout(() => setDrankSuccess(false), 3000);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    await addReview(wine.id, reviewForm);
    const refreshed = await getWine(wine.id);
    if (refreshed) setWine(refreshed);
    setReviewForm({ rating: null, notes: '', occasion: '' });
    setShowReviewForm(false);
  };

  const handleDelete = async () => {
    await deleteWine(wine.id);
    navigate('/');
  };

  const handleRating = async (rating) => {
    await updateWine(wine.id, { rating });
    setWine({ ...wine, rating });
  };

  const wineTypeInfo = WINE_TYPES.find((t) => t.value === wine.type);
  const similarTerms = getSimilarWineSearchTerms(wine);
  const lcboUrl = buildLCBOSearchUrl(wine);

  const ageYears = wine.vintage ? new Date().getFullYear() - wine.vintage : null;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-stone-100 rounded-lg">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-semibold truncate">{wine.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/edit/${wine.id}`}
              className="p-2 hover:bg-stone-100 rounded-lg text-stone-500"
            >
              <Edit3 size={18} />
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-red-50 rounded-lg text-stone-500 hover:text-red-500"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="h-56 bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center relative">
            {wine.imageData ? (
              <img src={wine.imageData} alt={wine.name} className="w-full h-full object-cover" />
            ) : (
              <WineBottle type={wine.type} size={60} />
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5">
                <WineTypeIcon type={wine.type} size="sm" />
                {wineTypeInfo?.label}
              </span>
              {wine.vintage && (
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">
                  {wine.vintage}
                </span>
              )}
            </div>
          </div>

          <div className="p-5">
            <h2 className="text-2xl font-bold text-stone-800">{wine.name}</h2>
            {wine.producer && (
              <p className="text-lg text-stone-500 mt-1">{wine.producer}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-stone-500">
              {wine.region && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {wine.region}
                  {wine.country && `, ${wine.country}`}
                </span>
              )}
              {wine.appellation && (
                <span className="flex items-center gap-1">
                  <Tag size={14} /> {wine.appellation}
                </span>
              )}
              {wine.alcoholPercent && (
                <span className="flex items-center gap-1">
                  <Percent size={14} /> {wine.alcoholPercent}% ABV
                </span>
              )}
              {wine.classification && (
                <span className="flex items-center gap-1">
                  <Sparkles size={14} /> {wine.classification}
                </span>
              )}
              {ageYears !== null && (
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {ageYears} year{ageYears !== 1 ? 's' : ''} old
                </span>
              )}
            </div>

            {wine.grapeVarieties?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {wine.grapeVarieties.map((g) => (
                  <span key={g} className="bg-grape-50 text-grape-700 px-2.5 py-1 rounded-full text-xs font-medium">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Rating */}
            <div className="mt-4">
              <label className="text-sm font-medium text-stone-500 mb-1 block">Your Rating</label>
              <StarRating rating={wine.rating} onRate={handleRating} size={28} />
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <Wine size={18} /> Inventory
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-stone-800">{wine.bottles}</div>
              <div className="text-sm text-stone-500">bottle{wine.bottles !== 1 ? 's' : ''} remaining</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAdjustBottles(-1)}
                disabled={wine.bottles === 0}
                className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 disabled:opacity-30"
              >
                <Minus size={18} />
              </button>
              <button
                onClick={() => handleAdjustBottles(1)}
                className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Storage Location */}
          {wine.storageLocation && (
            <div className="mt-3 flex items-center gap-2 text-sm text-stone-600 bg-stone-50 px-3 py-2 rounded-lg">
              <MapPinned size={15} className="text-stone-400 shrink-0" />
              <span className="font-medium">{wine.storageLocation}</span>
            </div>
          )}

          {/* Drank a Bottle button */}
          {wine.bottles > 0 && !drankSuccess && (
            <button
              onClick={() => setShowDrankConfirm(true)}
              className="mt-4 w-full py-3 bg-gradient-to-r from-burgundy to-burgundy/80 text-white rounded-xl font-semibold hover:from-burgundy/90 hover:to-burgundy/70 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <GlassWater size={18} /> Drank a Bottle
            </button>
          )}
          {wine.bottles === 0 && (
            <div className="mt-4 py-3 text-center text-sm text-stone-400 bg-stone-50 rounded-xl">
              No bottles remaining
            </div>
          )}
          {drankSuccess && (
            <div className="mt-4 py-3 text-center text-sm text-green-700 bg-green-50 rounded-xl font-medium animate-in">
              Cheers! Bottle logged and removed from inventory.
            </div>
          )}
          {(wine.purchasePrice || wine.purchaseDate || wine.purchaseLocation) && (
            <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-3 gap-3 text-sm">
              {wine.purchasePrice && (
                <div>
                  <div className="text-stone-400">Price</div>
                  <div className="font-medium">${wine.purchasePrice}</div>
                </div>
              )}
              {wine.purchaseDate && (
                <div>
                  <div className="text-stone-400">Purchased</div>
                  <div className="font-medium">{new Date(wine.purchaseDate).toLocaleDateString()}</div>
                </div>
              )}
              {wine.purchaseLocation && (
                <div>
                  <div className="text-stone-400">Location</div>
                  <div className="font-medium">{wine.purchaseLocation}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scores & Ratings */}
        <WineScoresCard wine={wine} />

        {/* Drinking Window */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-stone-700 flex items-center gap-2">
              <Calendar size={18} /> Drinking Window
            </h3>
            {!wine.drinkFrom && !wine.drinkTo && wine.vintage && (
              <button
                onClick={async () => {
                  setLookupLoading(true);
                  try {
                    const data = await lookupWineData(wine);
                    const updates = {};
                    if (data.drinkFrom) updates.drinkFrom = data.drinkFrom;
                    if (data.drinkTo) updates.drinkTo = data.drinkTo;
                    if (data.criticScores?.length && !wine.criticScores?.length) updates.criticScores = data.criticScores;
                    if (data.communityScore && !wine.communityScore) updates.communityScore = data.communityScore;
                    if (data.qualityPercentile && !wine.qualityPercentile) updates.qualityPercentile = data.qualityPercentile;
                    if (Object.keys(updates).length) {
                      const updated = await updateWine(wine.id, updates);
                      if (updated) setWine(updated);
                    }
                  } catch {}
                  setLookupLoading(false);
                }}
                disabled={lookupLoading}
                className="text-sm text-grape-600 hover:text-grape-800 flex items-center gap-1"
              >
                {lookupLoading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                Fetch Expert Window
              </button>
            )}
          </div>
          {wine.drinkFrom || wine.drinkTo ? (
            <DrinkingWindow drinkFrom={wine.drinkFrom} drinkTo={wine.drinkTo} vintage={wine.vintage} />
          ) : (
            <p className="text-sm text-stone-400">
              {wine.vintage
                ? 'No drinking window set. Click "Fetch Expert Window" to get recommendations based on critic reviews.'
                : 'Add a vintage to get drinking window recommendations.'}
            </p>
          )}
        </div>

        {/* Tasting Notes */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-stone-700">Tasting Notes</h3>
            {!wine.tastingNotes && (
              <button
                onClick={async () => {
                  setLookupLoading(true);
                  try {
                    const data = await lookupWineData(wine);
                    const updates = {};
                    if (data.tastingNotes) updates.tastingNotes = data.tastingNotes;
                    if (data.foodPairings?.length) {
                      updates.foodPairings = [...new Set([...(wine.foodPairings || []), ...data.foodPairings.slice(0, 8)])];
                    }
                    if (data.drinkFrom && !wine.drinkFrom) updates.drinkFrom = data.drinkFrom;
                    if (data.drinkTo && !wine.drinkFrom) updates.drinkTo = data.drinkTo;
                    if (data.criticScores?.length && !wine.criticScores?.length) updates.criticScores = data.criticScores;
                    if (data.communityScore && !wine.communityScore) updates.communityScore = data.communityScore;
                    if (data.qualityPercentile && !wine.qualityPercentile) updates.qualityPercentile = data.qualityPercentile;
                    if (Object.keys(updates).length) {
                      const updated = await updateWine(wine.id, updates);
                      if (updated) setWine(updated);
                    }
                  } catch {}
                  setLookupLoading(false);
                }}
                disabled={lookupLoading}
                className="text-sm text-grape-600 hover:text-grape-800 flex items-center gap-1"
              >
                {lookupLoading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                Fetch from Expert DB
              </button>
            )}
          </div>
          {wine.tastingNotes ? (
            <p className="text-stone-600 whitespace-pre-line">{wine.tastingNotes}</p>
          ) : (
            <p className="text-sm text-stone-400">No tasting notes yet. Click "Fetch from Expert DB" to auto-populate, or add your own via Edit.</p>
          )}
        </div>

        {/* Food Pairings */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-stone-700 flex items-center gap-2">
              <UtensilsCrossed size={18} /> Food Pairings
            </h3>
            {(!wine.foodPairings || wine.foodPairings.length === 0) && (
              <button
                onClick={async () => {
                  setLookupLoading(true);
                  try {
                    const data = await lookupWineData(wine);
                    const updates = {};
                    if (data.foodPairings?.length) {
                      updates.foodPairings = [...new Set([...(wine.foodPairings || []), ...data.foodPairings.slice(0, 8)])];
                    }
                    if (data.tastingNotes && !wine.tastingNotes) {
                      updates.tastingNotes = data.tastingNotes;
                    }
                    if (data.drinkFrom && !wine.drinkFrom) updates.drinkFrom = data.drinkFrom;
                    if (data.drinkTo && !wine.drinkFrom) updates.drinkTo = data.drinkTo;
                    if (data.criticScores?.length && !wine.criticScores?.length) updates.criticScores = data.criticScores;
                    if (data.communityScore && !wine.communityScore) updates.communityScore = data.communityScore;
                    if (data.qualityPercentile && !wine.qualityPercentile) updates.qualityPercentile = data.qualityPercentile;
                    if (Object.keys(updates).length) {
                      const updated = await updateWine(wine.id, updates);
                      if (updated) setWine(updated);
                    }
                  } catch {}
                  setLookupLoading(false);
                }}
                disabled={lookupLoading}
                className="text-sm text-grape-600 hover:text-grape-800 flex items-center gap-1"
              >
                {lookupLoading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                Fetch Pairings
              </button>
            )}
          </div>
          {wine.foodPairings?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {wine.foodPairings.map((p) => (
                <span key={p} className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full text-sm border border-amber-200">
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400">No pairings yet. Click "Fetch Pairings" to get sommelier-curated suggestions.</p>
          )}
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-stone-700">Tasting History</h3>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-sm text-burgundy hover:text-burgundy/80 flex items-center gap-1"
            >
              <Plus size={14} /> Add Tasting
            </button>
          </div>

          {showReviewForm && (
            <form onSubmit={handleAddReview} className="bg-stone-50 rounded-xl p-4 mb-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-stone-600 mb-1 block">Rating</label>
                <StarRating rating={reviewForm.rating} onRate={(r) => setReviewForm((f) => ({ ...f, rating: r }))} size={24} />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-600 mb-1 block">Occasion</label>
                <input
                  type="text"
                  value={reviewForm.occasion}
                  onChange={(e) => setReviewForm((f) => ({ ...f, occasion: e.target.value }))}
                  placeholder="e.g. Birthday dinner"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-600 mb-1 block">Notes</label>
                <textarea
                  value={reviewForm.notes}
                  onChange={(e) => setReviewForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="How was it?"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 text-sm border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-burgundy text-white rounded-lg">
                  Save Tasting
                </button>
              </div>
            </form>
          )}

          {wine.reviews?.length > 0 ? (
            <div className="space-y-3">
              {wine.reviews
                .slice()
                .reverse()
                .map((r) => (
                  <div key={r.id} className="border-l-2 border-stone-200 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-1">
                      {r.rating && <StarRating rating={r.rating} readonly size={14} />}
                      <span className="text-xs text-stone-400">
                        {new Date(r.date).toLocaleDateString()}
                      </span>
                      {r.occasion && (
                        <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                          {r.occasion}
                        </span>
                      )}
                    </div>
                    {r.notes && <p className="text-sm text-stone-600">{r.notes}</p>}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400">No tastings recorded yet</p>
          )}
        </div>

        {/* Suggest More Like This */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-semibold text-stone-700 flex items-center gap-2">
              <Sparkles size={18} className="text-burgundy" /> Find More Like This
            </h3>
            <span className="text-sm text-burgundy">{showSuggestions ? 'Hide' : 'Show'}</span>
          </button>

          {showSuggestions && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-stone-500">
                Search for similar {wineTypeInfo?.label.toLowerCase()} wines
                {wine.region ? ` from ${wine.region}` : ''}
                {wine.grapeVarieties?.length ? ` made with ${wine.grapeVarieties.join(', ')}` : ''}
              </p>

              <div className="grid gap-3">
                {/* LCBO */}
                <a
                  href={lcboUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <ShoppingCart size={20} className="text-green-700" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-stone-800">Search LCBO</div>
                    <div className="text-xs text-stone-500">Browse Ontario's largest wine retailer</div>
                  </div>
                  <ExternalLink size={16} className="text-stone-400 group-hover:text-stone-600" />
                </a>

                {/* Vintages */}
                <a
                  href={`https://www.lcbo.com/en/search?searchTerm=${encodeURIComponent((wine.grapeVarieties?.[0] || wine.region || wine.type) + ' vintages')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all group"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <Wine size={20} className="text-purple-700" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-stone-800">Vintages Collection</div>
                    <div className="text-xs text-stone-500">Premium & allocated wines, Bordeaux Futures</div>
                  </div>
                  <ExternalLink size={16} className="text-stone-400 group-hover:text-stone-600" />
                </a>

                {/* Wine Searcher */}
                <a
                  href={`https://www.wine-searcher.com/find/${encodeURIComponent([wine.name, wine.producer, wine.vintage].filter(Boolean).join(' '))}/1/canada-on`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all group"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <Search size={20} className="text-red-700" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-stone-800">Wine-Searcher (Ontario)</div>
                    <div className="text-xs text-stone-500">Find prices across Ontario retailers</div>
                  </div>
                  <ExternalLink size={16} className="text-stone-400 group-hover:text-stone-600" />
                </a>

                {/* Similar wine searches */}
                {similarTerms.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-stone-400 mb-2">Quick searches for similar wines:</p>
                    <div className="flex flex-wrap gap-2">
                      {similarTerms.map((term) => (
                        <a
                          key={term}
                          href={`https://www.lcbo.com/en/search?searchTerm=${encodeURIComponent(term)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 bg-stone-100 text-stone-600 rounded-full hover:bg-burgundy/10 hover:text-burgundy transition-colors flex items-center gap-1"
                        >
                          <Search size={12} /> {term}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drank a Bottle Confirmation Modal */}
      {showDrankConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-burgundy/10 rounded-full mb-3">
                <GlassWater size={28} className="text-burgundy" />
              </div>
              <h3 className="text-lg font-semibold text-stone-800">Drank a Bottle?</h3>
              <p className="text-stone-500 text-sm mt-1">
                This will remove 1 bottle from <strong>{wine.name}</strong> and log it to your tasting history.
              </p>
              <p className="text-xs text-stone-400 mt-2">
                {wine.bottles} bottle{wine.bottles !== 1 ? 's' : ''} remaining → {wine.bottles - 1}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDrankConfirm(false)}
                className="flex-1 py-2.5 border border-stone-300 rounded-lg font-medium hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDrankBottle}
                className="flex-1 py-2.5 bg-burgundy text-white rounded-lg font-medium hover:bg-burgundy/90 flex items-center justify-center gap-2"
              >
                <GlassWater size={16} /> Cheers!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-stone-800 mb-2">Delete Wine?</h3>
            <p className="text-stone-500 mb-6">
              Remove <strong>{wine.name}</strong> from your collection? This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-stone-300 rounded-lg font-medium hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WineScoresCard({ wine }) {
  const staticScores = getWineScores(wine);

  // Build scores from static DB or from AI-provided data on the wine record
  const aiCritics = wine.criticScores || [];
  const aiCommunity = wine.communityScore ? { avg: wine.communityScore, ratings: null } : null;
  const aiPercentile = wine.qualityPercentile
    ? { pct: 100 - wine.qualityPercentile, label: `Top ${100 - wine.qualityPercentile}% of all wines` }
    : null;

  const community = staticScores?.community || aiCommunity;
  const critics = staticScores?.critics || aiCritics;
  const percentile = staticScores?.percentile || aiPercentile;
  const avgCriticScore = staticScores?.avgCriticScore || (
    aiCritics.length > 0
      ? Math.round(aiCritics.filter(c => !c.maxScore || c.maxScore === 100).map(c => c.score).reduce((a, b) => a + b, 0) / aiCritics.filter(c => !c.maxScore || c.maxScore === 100).length)
      : null
  );

  if (!community && critics.length === 0 && !percentile) return null;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <h3 className="font-semibold text-stone-700 mb-4 flex items-center gap-2">
        <Tag size={18} /> Ratings & Scores
      </h3>

      {/* Community Rating + Percentile */}
      {(community || percentile) && (
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-stone-100">
          {community && (
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-burgundy">{community.avg.toFixed(1)}</div>
                <div className="text-[11px] text-stone-400 mt-0.5">/ 5.0</div>
              </div>
              <div>
                <div className="text-sm font-medium text-stone-700">Community Rating</div>
                <div className="text-xs text-stone-400">{community.ratings?.toLocaleString()} ratings</div>
              </div>
            </div>
          )}
          {percentile && (
            <div className="ml-auto text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-full">
                <span className="text-sm font-bold text-amber-700">Top {percentile.pct}%</span>
              </div>
              <div className="text-[11px] text-stone-400 mt-1">{percentile.label}</div>
            </div>
          )}
        </div>
      )}

      {/* Professional Scores */}
      {critics.length > 0 && (
        <div>
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Professional Scores</div>
          <div className="space-y-2">
            {critics.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-stone-700">{c.source}</span>
                  {c.vintage && (
                    <span className="text-[11px] text-stone-400">({c.vintage})</span>
                  )}
                  {c.note && (
                    <span className="text-[11px] text-stone-400 italic">{c.note}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-bold ${
                    (c.maxScore ? (c.score / c.maxScore * 100) : c.score) >= 95 ? 'text-green-700' :
                    (c.maxScore ? (c.score / c.maxScore * 100) : c.score) >= 90 ? 'text-emerald-600' :
                    'text-stone-700'
                  }`}>
                    {c.score}{c.maxScore ? `/${c.maxScore}` : ''}
                  </span>
                  {!c.maxScore && c.score >= 95 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">Outstanding</span>
                  )}
                  {!c.maxScore && c.score >= 90 && c.score < 95 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">Excellent</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {avgCriticScore && (
            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-stone-500">Average critic score</span>
              <span className="text-sm font-bold text-stone-700">{avgCriticScore} pts</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
