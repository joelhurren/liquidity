import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Sparkles } from 'lucide-react';
import { useWines } from '../hooks/useWines';
import { WINE_TYPES, COMMON_GRAPES, FOOD_PAIRING_SUGGESTIONS, REGIONS, COUNTRIES, estimateDrinkingWindow } from '../data/wineData';
import StarRating from '../components/StarRating';

export default function EditWine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getWine, updateWine } = useWines();
  const [grapeInput, setGrapeInput] = useState('');
  const [pairingInput, setPairingInput] = useState('');
  const [form, setForm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wine = await getWine(id);
      if (cancelled) return;
      if (!wine) { navigate('/'); return; }
      setForm({
        ...wine,
        vintage: wine.vintage?.toString() || '',
        bottles: wine.bottles?.toString() || '1',
        purchasePrice: wine.purchasePrice?.toString() || '',
        drinkFrom: wine.drinkFrom?.toString() || '',
        drinkTo: wine.drinkTo?.toString() || '',
        alcoholPercent: wine.alcoholPercent?.toString() || '',
      });
    })();
    return () => { cancelled = true; };
  }, [id, navigate, getWine]);

  if (!form) return null;

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addGrape = (grape) => {
    if (grape && !form.grapeVarieties.includes(grape)) {
      set('grapeVarieties', [...form.grapeVarieties, grape]);
    }
    setGrapeInput('');
  };

  const removeGrape = (grape) => set('grapeVarieties', form.grapeVarieties.filter((g) => g !== grape));

  const addPairing = (pairing) => {
    if (pairing && !form.foodPairings.includes(pairing)) {
      set('foodPairings', [...form.foodPairings, pairing]);
    }
    setPairingInput('');
  };

  const removePairing = (pairing) => set('foodPairings', form.foodPairings.filter((p) => p !== pairing));

  const autoEstimateWindow = () => {
    const window = estimateDrinkingWindow({ ...form, vintage: parseInt(form.vintage) });
    if (window) {
      set('drinkFrom', window.from.toString());
      setTimeout(() => set('drinkTo', window.to.toString()), 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateWine(id, {
      name: form.name,
      producer: form.producer,
      vintage: form.vintage ? parseInt(form.vintage) : null,
      region: form.region,
      country: form.country,
      appellation: form.appellation,
      type: form.type,
      grapeVarieties: form.grapeVarieties,
      bottles: parseInt(form.bottles) || 0,
      purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
      purchaseDate: form.purchaseDate,
      purchaseLocation: form.purchaseLocation,
      drinkFrom: form.drinkFrom ? parseInt(form.drinkFrom) : null,
      drinkTo: form.drinkTo ? parseInt(form.drinkTo) : null,
      rating: form.rating,
      tastingNotes: form.tastingNotes,
      foodPairings: form.foodPairings,
      alcoholPercent: form.alcoholPercent ? parseFloat(form.alcoholPercent) : null,
      classification: form.classification,
      storageLocation: form.storageLocation || '',
    });
    navigate(`/wine/${id}`);
  };

  const suggestedGrapes = COMMON_GRAPES[form.type] || COMMON_GRAPES.red;
  const suggestedPairings = FOOD_PAIRING_SUGGESTIONS[form.type] || FOOD_PAIRING_SUGGESTIONS.red;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">Edit Wine</h1>
        </div>
      </header>

      <form id="edit-wine-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-semibold text-stone-700">Wine Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-600 mb-1">Wine Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Producer</label>
              <input type="text" value={form.producer} onChange={(e) => set('producer', e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Vintage</label>
              <input type="number" value={form.vintage} onChange={(e) => set('vintage', e.target.value)} min="1900" max="2030"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy" />
            </div>
          </div>

          {/* Wine Type */}
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {WINE_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => set('type', t.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    form.type === t.value ? 'bg-burgundy text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
              <input type="text" value={form.region} onChange={(e) => set('region', e.target.value)} list="regions-list"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy" />
              <datalist id="regions-list">{REGIONS.map((r) => <option key={r} value={r} />)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Country</label>
              <input type="text" value={form.country} onChange={(e) => set('country', e.target.value)} list="countries-list"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy" />
              <datalist id="countries-list">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Appellation</label>
              <input type="text" value={form.appellation} onChange={(e) => set('appellation', e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Classification</label>
              <input type="text" value={form.classification} onChange={(e) => set('classification', e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy" />
            </div>
          </div>

          {/* Grapes */}
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">Grape Varieties</label>
            {form.grapeVarieties.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.grapeVarieties.map((g) => (
                  <span key={g} className="inline-flex items-center gap-1 bg-grape-100 text-grape-800 px-3 py-1 rounded-full text-sm">
                    {g} <button type="button" onClick={() => removeGrape(g)}><X size={14} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={grapeInput} onChange={(e) => setGrapeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGrape(grapeInput.trim()); } }}
                placeholder="Type or select..."
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm" />
              <button type="button" onClick={() => addGrape(grapeInput.trim())} className="px-3 py-2 bg-stone-100 rounded-lg hover:bg-stone-200">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestedGrapes.filter((g) => !form.grapeVarieties.includes(g)).slice(0, 8).map((g) => (
                <button key={g} type="button" onClick={() => addGrape(g)}
                  className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full hover:bg-grape-100 hover:text-grape-700 transition-colors">
                  + {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Alcohol %</label>
            <input type="number" value={form.alcoholPercent} onChange={(e) => set('alcoholPercent', e.target.value)} step="0.1" min="0" max="100"
              className="w-32 px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy" />
          </div>
        </section>

        {/* Inventory */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-semibold text-stone-700">Inventory & Purchase</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Bottles</label>
              <input type="number" value={form.bottles} onChange={(e) => set('bottles', e.target.value)} min="0"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Price</label>
              <input type="number" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} step="0.01" min="0"
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Date</label>
              <input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Purchase Location</label>
            <input type="text" value={form.purchaseLocation} onChange={(e) => set('purchaseLocation', e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Storage Location</label>
            <input type="text" value={form.storageLocation || ''} onChange={(e) => set('storageLocation', e.target.value)}
              placeholder="e.g. Left wine fridge, Basement cellar, E29, AF16..."
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg" />
          </div>
        </section>

        {/* Drinking Window */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-stone-700">Drinking Window</h2>
            {form.vintage && (
              <button type="button" onClick={autoEstimateWindow} className="text-sm text-burgundy flex items-center gap-1">
                <Sparkles size={14} /> Auto-estimate
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">From</label>
              <input type="number" value={form.drinkFrom} onChange={(e) => set('drinkFrom', e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">To</label>
              <input type="number" value={form.drinkTo} onChange={(e) => set('drinkTo', e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg" />
            </div>
          </div>
        </section>

        {/* Rating & Notes */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-semibold text-stone-700">Rating & Notes</h2>
          <div>
            <label className="text-sm font-medium text-stone-600 mb-2 block">Rating</label>
            <StarRating rating={form.rating} onRate={(r) => set('rating', r)} size={32} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Tasting Notes</label>
            <textarea value={form.tastingNotes} onChange={(e) => set('tastingNotes', e.target.value)} rows={3}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg resize-none" />
          </div>
        </section>

        {/* Food Pairings */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <h2 className="font-semibold text-stone-700">Food Pairings</h2>
          {form.foodPairings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.foodPairings.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-sm border border-amber-200">
                  {p} <button type="button" onClick={() => removePairing(p)}><X size={14} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input type="text" value={pairingInput} onChange={(e) => setPairingInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPairing(pairingInput.trim()); } }}
              placeholder="Add pairing..." className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm" />
            <button type="button" onClick={() => addPairing(pairingInput.trim())} className="px-3 py-2 bg-stone-100 rounded-lg hover:bg-stone-200">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPairings.filter((p) => !form.foodPairings.includes(p)).slice(0, 10).map((p) => (
              <button key={p} type="button" onClick={() => addPairing(p)}
                className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors">
                + {p}
              </button>
            ))}
          </div>
        </section>

        {/* Spacer for sticky bottom bar */}
        <div className="h-24" />

        {/* Sticky bottom bar - inside form for native submit */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 pt-3 z-40" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="flex gap-3 max-w-3xl mx-auto">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-stone-300 rounded-xl font-semibold hover:bg-stone-100">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-3 bg-burgundy text-white rounded-xl font-semibold hover:bg-burgundy/90 shadow-lg">
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
