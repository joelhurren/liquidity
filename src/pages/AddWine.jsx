import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Plus, X, Sparkles, Loader2, Globe } from 'lucide-react';
import { useWines } from '../hooks/useWines';
import { WINE_TYPES, COMMON_GRAPES, FOOD_PAIRING_SUGGESTIONS, REGIONS, COUNTRIES, estimateDrinkingWindow } from '../data/wineData';
import { lookupWineData, scanWineLabel } from '../data/wineLookup';
import { searchKnownWines } from '../data/knownWines';
import StarRating from '../components/StarRating';

export default function AddWine() {
  const navigate = useNavigate();
  const { addWine } = useWines();
  const fileInputRef = useRef(null);
  const [grapeInput, setGrapeInput] = useState('');
  const [pairingInput, setPairingInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [wineSuggestions, setWineSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    name: '',
    producer: '',
    vintage: '',
    region: '',
    country: '',
    appellation: '',
    type: 'red',
    grapeVarieties: [],
    bottles: 1,
    purchasePrice: '',
    purchaseDate: '',
    purchaseLocation: '',
    drinkFrom: '',
    drinkTo: '',
    rating: null,
    tastingNotes: '',
    foodPairings: [],
    alcoholPercent: '',
    classification: '',
    storageLocation: '',
    imageData: null,
    criticScores: [],
    communityScore: null,
    qualityPercentile: null,
  });

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addGrape = (grape) => {
    if (grape && !form.grapeVarieties.includes(grape)) {
      set('grapeVarieties', [...form.grapeVarieties, grape]);
    }
    setGrapeInput('');
  };

  const removeGrape = (grape) => {
    set('grapeVarieties', form.grapeVarieties.filter((g) => g !== grape));
  };

  const addPairing = (pairing) => {
    if (pairing && !form.foodPairings.includes(pairing)) {
      set('foodPairings', [...form.foodPairings, pairing]);
    }
    setPairingInput('');
  };

  const removePairing = (pairing) => {
    set('foodPairings', form.foodPairings.filter((p) => p !== pairing));
  };

  const handleNameChange = (value) => {
    set('name', value);
    const results = searchKnownWines(value);
    setWineSuggestions(results);
    setShowSuggestions(results.length > 0 && value.length >= 2);
  };

  const applyWineSuggestion = (wine) => {
    set('name', wine.name);
    if (!form.region) set('region', wine.region);
    if (!form.country) set('country', wine.country);
    if (!form.appellation) set('appellation', wine.appellation);
    if (wine.type) set('type', wine.type);
    if (wine.classification && !form.classification) set('classification', wine.classification);
    if (wine.grapes?.length && form.grapeVarieties.length === 0) {
      set('grapeVarieties', wine.grapes);
    }
    if (wine.producer) set('producer', wine.producer);
    setShowSuggestions(false);
    setWineSuggestions([]);
  };

  const autoEstimateWindow = () => {
    const window = estimateDrinkingWindow({ ...form, vintage: parseInt(form.vintage) });
    if (window) {
      set('drinkFrom', window.from.toString());
      setTimeout(() => set('drinkTo', window.to.toString()), 0);
    }
  };

  const applyAIData = (data) => {
    if (data.name && !form.name) set('name', data.name);
    if (data.producer && !form.producer) set('producer', data.producer);
    if (data.vintage && !form.vintage) set('vintage', data.vintage.toString());
    if (data.region && !form.region) set('region', data.region);
    if (data.country && !form.country) set('country', data.country);
    if (data.appellation && !form.appellation) set('appellation', data.appellation);
    if (data.type) set('type', data.type);
    if (data.grapeVarieties?.length && form.grapeVarieties.length === 0) {
      set('grapeVarieties', data.grapeVarieties);
    }
    if (data.classification && !form.classification) set('classification', data.classification);
    if (data.alcoholPercent && !form.alcoholPercent) {
      set('alcoholPercent', data.alcoholPercent.toString());
    }
    if (data.foodPairings?.length) {
      const newPairings = data.foodPairings.filter((p) => !form.foodPairings.includes(p));
      set('foodPairings', [...form.foodPairings, ...newPairings.slice(0, 8)]);
    }
    if (data.tastingNotes && !form.tastingNotes) set('tastingNotes', data.tastingNotes);
    if (data.drinkFrom && !form.drinkFrom) {
      set('drinkFrom', data.drinkFrom.toString());
      setTimeout(() => set('drinkTo', (data.drinkTo || '').toString()), 0);
    }
    if (data.criticScores?.length) set('criticScores', data.criticScores);
    if (data.communityScore) set('communityScore', data.communityScore);
    if (data.qualityPercentile) set('qualityPercentile', data.qualityPercentile);
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      set('imageData', dataUrl);

      // Auto-scan the label with AI vision
      setScanning(true);
      setScanError(null);
      try {
        const data = await scanWineLabel(dataUrl);
        applyAIData(data);
        setLookupDone(true);
      } catch (err) {
        console.error('Label scan error:', err);
        setScanError(`Could not read label: ${err.message}. Try entering the wine name manually below.`);
      }
      setScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const wine = await addWine({
        ...form,
        vintage: form.vintage ? parseInt(form.vintage) : null,
        bottles: parseInt(form.bottles) || 1,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
        drinkFrom: form.drinkFrom ? parseInt(form.drinkFrom) : null,
        drinkTo: form.drinkTo ? parseInt(form.drinkTo) : null,
        alcoholPercent: form.alcoholPercent ? parseFloat(form.alcoholPercent) : null,
      });
      navigate(`/wine/${wine.id}`, { replace: true });
    } catch (err) {
      console.error('Failed to add wine:', err);
      setSubmitError('Failed to save wine. Please try again.');
      setSubmitting(false);
    }
  };

  const suggestedGrapes = COMMON_GRAPES[form.type] || COMMON_GRAPES.red;
  const suggestedPairings = FOOD_PAIRING_SUGGESTIONS[form.type] || FOOD_PAIRING_SUGGESTIONS.red;

  // Fetch expert food pairings & tasting notes based on wine details
  const fetchWineInsights = useCallback(async () => {
    setLookupLoading(true);
    try {
      const data = await lookupWineData({
        name: form.name,
        producer: form.producer,
        vintage: form.vintage,
        region: form.region,
        type: form.type,
        grapeVarieties: form.grapeVarieties,
        classification: form.classification,
      });
      applyAIData(data);
      setLookupDone(true);
    } catch (err) {
      console.error('Wine lookup error:', err);
    }
    setLookupLoading(false);
  }, [form]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hidden file input for photo capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        className="hidden"
      />

      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">Add Wine</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Photo Section */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-700 mb-3">Photo</h2>
          {form.imageData ? (
            <div className="space-y-3">
              <div className="relative">
                <img src={form.imageData} alt="Wine label" className="w-full max-h-64 object-contain rounded-xl bg-stone-100" />
                <button
                  type="button"
                  onClick={() => { set('imageData', null); setScanError(null); }}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow hover:bg-white"
                >
                  <X size={16} />
                </button>
                {scanning && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                    <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-2 shadow-lg">
                      <Loader2 size={18} className="animate-spin text-grape-600" />
                      <span className="text-sm font-medium text-stone-700">Reading label...</span>
                    </div>
                  </div>
                )}
              </div>
              {scanError && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{scanError}</p>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-grape-600 hover:text-grape-800 flex items-center gap-1"
              >
                <Camera size={14} /> Retake photo
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-8 border-2 border-dashed border-stone-300 rounded-xl hover:border-burgundy hover:bg-burgundy/5 transition-colors flex flex-col items-center gap-2 text-stone-500"
              >
                <Camera size={32} />
                <span className="font-medium">Take Photo</span>
              </button>
            </div>
          )}
        </section>

        {/* Basic Info */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-semibold text-stone-700">Wine Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 relative">
              <label className="block text-sm font-medium text-stone-600 mb-1">Wine Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => { if (wineSuggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Start typing — e.g. Château Léoville, Opus One, Sassicaia..."
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
              {showSuggestions && wineSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  <div className="px-3 py-1.5 text-xs text-stone-400 border-b border-stone-100">
                    Select to auto-fill all details
                  </div>
                  {wineSuggestions.map((wine) => (
                    <button
                      key={wine.name}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyWineSuggestion(wine)}
                      className="w-full px-3 py-2.5 text-left hover:bg-grape-50 flex items-center justify-between gap-2 border-b border-stone-50 last:border-0"
                    >
                      <div>
                        <div className="font-medium text-stone-800 text-sm">{wine.name}</div>
                        <div className="text-xs text-stone-500">
                          {wine.producer !== wine.name ? `${wine.producer} · ` : ''}{wine.region}{wine.country ? `, ${wine.country}` : ''} · {wine.grapes.slice(0, 2).join(', ')}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full shrink-0">
                        {wine.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Producer / Winery</label>
              <input
                type="text"
                value={form.producer}
                onChange={(e) => set('producer', e.target.value)}
                placeholder="e.g. Château Margaux"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Vintage</label>
              <input
                type="number"
                value={form.vintage}
                onChange={(e) => set('vintage', e.target.value)}
                placeholder="e.g. 2018"
                min="1900"
                max="2030"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>
          </div>

          {/* Wine Type */}
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {WINE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('type', t.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    form.type === t.value
                      ? 'bg-burgundy text-white shadow-md'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Region</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => set('region', e.target.value)}
                list="regions-list"
                placeholder="e.g. Bordeaux"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
              <datalist id="regions-list">
                {REGIONS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
                list="countries-list"
                placeholder="e.g. France"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
              <datalist id="countries-list">
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Appellation</label>
              <input
                type="text"
                value={form.appellation}
                onChange={(e) => set('appellation', e.target.value)}
                placeholder="e.g. Margaux AOC"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Classification</label>
              <input
                type="text"
                value={form.classification}
                onChange={(e) => set('classification', e.target.value)}
                placeholder="e.g. Premier Grand Cru"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>
          </div>

          {/* Grape Varieties */}
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">Grape Varieties</label>
            {form.grapeVarieties.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.grapeVarieties.map((g) => (
                  <span key={g} className="inline-flex items-center gap-1 bg-grape-100 text-grape-800 px-3 py-1 rounded-full text-sm">
                    {g}
                    <button type="button" onClick={() => removeGrape(g)} className="hover:text-grape-600">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={grapeInput}
                onChange={(e) => setGrapeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addGrape(grapeInput.trim());
                  }
                }}
                placeholder="Type or select below..."
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy text-sm"
              />
              <button
                type="button"
                onClick={() => addGrape(grapeInput.trim())}
                className="px-3 py-2 bg-stone-100 rounded-lg hover:bg-stone-200"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestedGrapes
                .filter((g) => !form.grapeVarieties.includes(g))
                .slice(0, 8)
                .map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => addGrape(g)}
                    className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full hover:bg-grape-100 hover:text-grape-700 transition-colors"
                  >
                    + {g}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Alcohol %</label>
            <input
              type="number"
              value={form.alcoholPercent}
              onChange={(e) => set('alcoholPercent', e.target.value)}
              placeholder="e.g. 13.5"
              step="0.1"
              min="0"
              max="100"
              className="w-32 px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
            />
          </div>
        </section>

        {/* Inventory */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-semibold text-stone-700">Inventory & Purchase</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Bottles</label>
              <input
                type="number"
                value={form.bottles}
                onChange={(e) => set('bottles', e.target.value)}
                min="0"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Price (per bottle)</label>
              <input
                type="number"
                value={form.purchasePrice}
                onChange={(e) => set('purchasePrice', e.target.value)}
                placeholder="$"
                step="0.01"
                min="0"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => set('purchaseDate', e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Purchase Location</label>
            <input
              type="text"
              value={form.purchaseLocation}
              onChange={(e) => set('purchaseLocation', e.target.value)}
              placeholder="e.g. LCBO, Vintages, local shop..."
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Storage Location</label>
            <input
              type="text"
              value={form.storageLocation}
              onChange={(e) => set('storageLocation', e.target.value)}
              placeholder="e.g. Basement cellar, E29, Cottage"
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
            />
          </div>
        </section>

        {/* Drinking Window */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-stone-700">Drinking Window</h2>
            {form.vintage && (
              <button
                type="button"
                onClick={autoEstimateWindow}
                className="text-sm text-burgundy hover:text-burgundy/80 flex items-center gap-1"
              >
                <Sparkles size={14} /> Auto-estimate
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Drink From (year)</label>
              <input
                type="number"
                value={form.drinkFrom}
                onChange={(e) => set('drinkFrom', e.target.value)}
                placeholder="e.g. 2025"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Drink To (year)</label>
              <input
                type="number"
                value={form.drinkTo}
                onChange={(e) => set('drinkTo', e.target.value)}
                placeholder="e.g. 2035"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>
          </div>
        </section>

        {/* Fetch Wine Data from Internet */}
        {form.name && (
          <section className="bg-gradient-to-r from-grape-50 to-wine-50 rounded-2xl border border-grape-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-stone-700 flex items-center gap-2">
                  <Globe size={18} className="text-grape-600" /> Fetch Wine Data
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  Auto-fill pairings, tasting notes, and drinking window from our database
                </p>
              </div>
              <button
                type="button"
                onClick={fetchWineInsights}
                disabled={lookupLoading}
                className="px-5 py-2.5 bg-grape-600 text-white rounded-lg font-medium hover:bg-grape-700 disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {lookupLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Fetching...</>
                ) : lookupDone ? (
                  <><Sparkles size={16} /> Refresh</>
                ) : (
                  <><Globe size={16} /> Fetch</>
                )}
              </button>
            </div>
            {lookupDone && (
              <p className="text-xs text-green-600 mt-2">
                Data has been populated below. Review and adjust as needed.
              </p>
            )}
          </section>
        )}

        {/* Rating & Notes */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-semibold text-stone-700">Rating & Tasting Notes</h2>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">Your Rating</label>
            <StarRating rating={form.rating} onRate={(r) => set('rating', r)} size={32} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Tasting Notes</label>
            <textarea
              value={form.tastingNotes}
              onChange={(e) => set('tastingNotes', e.target.value)}
              rows={3}
              placeholder="Aromas, flavors, body, finish..."
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy resize-none"
            />
          </div>
        </section>

        {/* Food Pairings */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-semibold text-stone-700">Food Pairings</h2>
          {form.foodPairings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.foodPairings.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-sm border border-amber-200">
                  {p}
                  <button type="button" onClick={() => removePairing(p)} className="hover:text-amber-600">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={pairingInput}
              onChange={(e) => setPairingInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPairing(pairingInput.trim());
                }
              }}
              placeholder="Add a food pairing..."
              className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy text-sm"
            />
            <button
              type="button"
              onClick={() => addPairing(pairingInput.trim())}
              className="px-3 py-2 bg-stone-100 rounded-lg hover:bg-stone-200"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPairings
              .filter((p) => !form.foodPairings.includes(p))
              .slice(0, 10)
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => addPairing(p)}
                  className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors"
                >
                  + {p}
                </button>
              ))}
          </div>
        </section>

        {/* Submit */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">
            {submitError}
          </div>
        )}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="flex-1 py-3 border border-stone-300 rounded-xl font-semibold hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-burgundy text-white rounded-xl font-semibold hover:bg-burgundy/90 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 size={18} className="animate-spin" /> Saving...</>
            ) : (
              'Add to Collection'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
