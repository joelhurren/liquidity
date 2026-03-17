import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Wine, ShoppingCart, ExternalLink, DollarSign, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { useWines } from '../hooks/useWines';
import { buildLCBOSearchUrl, buildVintagesSearchUrl, FOOD_PAIRING_SUGGESTIONS } from '../data/wineData';
import { getExpertPairings } from '../data/wineLookup';
import { searchKnownWines } from '../data/knownWines';
import WineTypeIcon from '../components/WineTypeIcon';
import StarRating from '../components/StarRating';
import WineBottle from '../components/WineBottle';

const OCCASIONS = [
  { value: 'dinner', label: 'Dinner Party', icon: '🍽️' },
  { value: 'casual', label: 'Casual Night In', icon: '🛋️' },
  { value: 'date', label: 'Date Night', icon: '❤️' },
  { value: 'celebration', label: 'Celebration', icon: '🎉' },
  { value: 'bbq', label: 'BBQ / Outdoor', icon: '🔥' },
  { value: 'pairing', label: 'Food Pairing', icon: '👨‍🍳' },
];

const MEAL_TYPES = [
  { value: 'steak', label: 'Steak / Red Meat', icon: '🥩' },
  { value: 'poultry', label: 'Chicken / Poultry', icon: '🍗' },
  { value: 'seafood', label: 'Fish / Seafood', icon: '🐟' },
  { value: 'pasta', label: 'Pasta / Italian', icon: '🍝' },
  { value: 'asian', label: 'Asian Cuisine', icon: '🥢' },
  { value: 'cheese', label: 'Cheese / Charcuterie', icon: '🧀' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { value: 'dessert', label: 'Dessert', icon: '🍰' },
  { value: 'none', label: 'No food planned', icon: '🤷' },
];

// Map meals to preferred wine types and grapes
const MEAL_WINE_AFFINITIES = {
  steak: { types: ['red'], grapes: ['cabernet sauvignon', 'malbec', 'syrah', 'shiraz', 'tempranillo', 'nebbiolo'], weight: 3 },
  poultry: { types: ['red', 'white'], grapes: ['pinot noir', 'chardonnay', 'grenache', 'viognier', 'chenin blanc'], weight: 2 },
  seafood: { types: ['white', 'sparkling'], grapes: ['sauvignon blanc', 'chardonnay', 'riesling', 'pinot grigio', 'albariño'], weight: 3 },
  pasta: { types: ['red', 'white'], grapes: ['sangiovese', 'nebbiolo', 'pinot grigio', 'merlot'], weight: 2 },
  asian: { types: ['white', 'rose'], grapes: ['riesling', 'gewürztraminer', 'pinot grigio', 'sauvignon blanc', 'chenin blanc'], weight: 3 },
  cheese: { types: ['red', 'white', 'fortified'], grapes: ['cabernet sauvignon', 'chardonnay', 'riesling'], weight: 1 },
  vegetarian: { types: ['white', 'rose', 'orange'], grapes: ['sauvignon blanc', 'pinot noir', 'grenache', 'viognier'], weight: 2 },
  dessert: { types: ['dessert', 'fortified', 'sparkling'], grapes: ['riesling', 'sémillon', 'chenin blanc'], weight: 3 },
  none: { types: ['red', 'white', 'rose', 'sparkling'], grapes: [], weight: 0 },
};

const OCCASION_PREFERENCES = {
  dinner: { types: ['red', 'white'], priceWeight: 1.2, preferHighRated: true },
  casual: { types: ['red', 'white', 'rose'], priceWeight: 0.8, preferHighRated: false },
  date: { types: ['sparkling', 'red', 'white'], priceWeight: 1.5, preferHighRated: true },
  celebration: { types: ['sparkling', 'dessert'], priceWeight: 1.5, preferHighRated: true },
  bbq: { types: ['red', 'rose'], priceWeight: 0.7, preferHighRated: false },
  pairing: { types: ['red', 'white', 'rose'], priceWeight: 1.0, preferHighRated: false },
};

function scoreCellarWine(wine, { budget, occasion, meal }) {
  let score = 0;
  const currentYear = new Date().getFullYear();

  // Budget fit (if they have purchase price)
  if (wine.purchasePrice && budget) {
    if (wine.purchasePrice <= budget) {
      score += 10 + (wine.purchasePrice / budget) * 15;
    } else {
      score -= (wine.purchasePrice - budget) / budget * 20;
    }
  } else if (!wine.purchasePrice) {
    score += 5;
  }

  // Drinking window
  if (wine.drinkFrom && wine.drinkTo) {
    if (currentYear >= wine.drinkFrom && currentYear <= wine.drinkTo) {
      const midPoint = (wine.drinkFrom + wine.drinkTo) / 2;
      const distFromPeak = Math.abs(currentYear - midPoint);
      const halfWindow = (wine.drinkTo - wine.drinkFrom) / 2;
      score += 20 - (distFromPeak / halfWindow) * 10;
    } else if (currentYear < wine.drinkFrom) {
      score -= 15;
    } else {
      score -= 25;
    }
  }

  // Must have bottles
  if (!wine.bottles || wine.bottles <= 0) return -999;

  // Meal affinity
  if (meal && meal !== 'none') {
    const affinity = MEAL_WINE_AFFINITIES[meal];
    if (affinity) {
      if (affinity.types.includes(wine.type)) score += 15 * affinity.weight;
      const wineGrapes = (wine.grapeVarieties || []).map(g => g.toLowerCase());
      const grapeMatch = wineGrapes.some(g => affinity.grapes.some(ag => g.includes(ag)));
      if (grapeMatch) score += 10 * affinity.weight;
    }
  }

  // Occasion fit
  if (occasion) {
    const pref = OCCASION_PREFERENCES[occasion];
    if (pref) {
      if (pref.types.includes(wine.type)) score += 10;
      if (pref.preferHighRated && wine.rating >= 4) score += 15;
      if (pref.preferHighRated && wine.rating >= 4.5) score += 10;
    }
  }

  // Rating bonus
  if (wine.rating) score += wine.rating * 3;

  return score;
}

function getShopSuggestions(budget, occasion, meal) {
  const suggestions = [];
  const affinity = meal && meal !== 'none' ? MEAL_WINE_AFFINITIES[meal] : null;
  const occPref = occasion ? OCCASION_PREFERENCES[occasion] : null;

  if (budget <= 20) {
    suggestions.push(
      { name: 'Côtes du Rhône', type: 'red', reason: 'Great value Rhône blend — peppery & spiced', priceRange: '$12–$18', searchTerms: 'Côtes du Rhône' },
      { name: 'Malbec from Mendoza', type: 'red', reason: 'Bold and juicy — amazing value from Argentina', priceRange: '$10–$18', searchTerms: 'Malbec Mendoza' },
      { name: 'Vinho Verde', type: 'white', reason: 'Crisp and refreshing Portuguese white', priceRange: '$8–$14', searchTerms: 'Vinho Verde' },
      { name: 'Cava Brut', type: 'sparkling', reason: 'Spanish sparkling, fraction of Champagne price', priceRange: '$10–$16', searchTerms: 'Cava Brut' },
      { name: 'Chianti Classico', type: 'red', reason: 'Cherry & herb, perfect with Italian food', priceRange: '$12–$20', searchTerms: 'Chianti Classico' },
    );
  } else if (budget <= 40) {
    suggestions.push(
      { name: 'Cru Beaujolais (Morgon / Fleurie)', type: 'red', reason: 'Elegant Gamay, silky & versatile', priceRange: '$20–$30', searchTerms: 'Morgon Beaujolais' },
      { name: 'Grüner Veltliner from Austria', type: 'white', reason: 'Peppery and mineral, food-friendly', priceRange: '$18–$30', searchTerms: 'Grüner Veltliner' },
      { name: 'Rioja Reserva', type: 'red', reason: 'Vanilla, leather, and cherry — aged and ready', priceRange: '$20–$35', searchTerms: 'Rioja Reserva' },
      { name: 'Sancerre', type: 'white', reason: 'Loire Sauvignon Blanc, mineral and elegant', priceRange: '$22–$35', searchTerms: 'Sancerre' },
      { name: 'Prosecco Superiore DOCG', type: 'sparkling', reason: 'Step up from regular Prosecco', priceRange: '$18–$30', searchTerms: 'Prosecco Superiore DOCG' },
      { name: 'Oregon Pinot Noir', type: 'red', reason: 'Earthy, bright cherry — Burgundy vibes', priceRange: '$25–$40', searchTerms: 'Oregon Pinot Noir Willamette' },
    );
  } else if (budget <= 80) {
    suggestions.push(
      { name: 'Châteauneuf-du-Pape', type: 'red', reason: 'Rich Rhône blend, garrigue & dark fruit', priceRange: '$40–$65', searchTerms: 'Châteauneuf du Pape' },
      { name: 'Barolo', type: 'red', reason: 'King of Italian wines — rose, tar & cherry', priceRange: '$40–$75', searchTerms: 'Barolo DOCG' },
      { name: 'Napa Cabernet Sauvignon', type: 'red', reason: 'Bold, rich, and age-worthy', priceRange: '$40–$75', searchTerms: 'Napa Valley Cabernet Sauvignon' },
      { name: 'Champagne (Grower)', type: 'sparkling', reason: 'Artisan Champagne, more character than brands', priceRange: '$40–$70', searchTerms: 'Champagne Grower' },
      { name: 'White Burgundy', type: 'white', reason: 'Complex Chardonnay with hazelnut & mineral', priceRange: '$40–$70', searchTerms: 'Meursault Burgundy' },
      { name: 'Brunello di Montalcino', type: 'red', reason: 'Sangiovese at its finest — leather & cherry', priceRange: '$45–$80', searchTerms: 'Brunello di Montalcino' },
    );
  } else {
    suggestions.push(
      { name: 'Bordeaux Classified Growth', type: 'red', reason: 'Iconic blends from the finest estates', priceRange: '$80–$200+', searchTerms: 'Bordeaux Cru Classé' },
      { name: 'Barolo Riserva', type: 'red', reason: 'Extended aging, extraordinary complexity', priceRange: '$80–$150', searchTerms: 'Barolo Riserva' },
      { name: 'Dom Pérignon / Krug', type: 'sparkling', reason: 'Prestige Champagne for special moments', priceRange: '$180–$300', searchTerms: 'Dom Pérignon' },
      { name: 'Super Tuscan', type: 'red', reason: 'Sassicaia, Ornellaia, Tignanello — Italian legends', priceRange: '$80–$200', searchTerms: 'Sassicaia Ornellaia' },
      { name: 'Napa Cult Cabernet', type: 'red', reason: 'Opus One, Caymus Special — concentrated & plush', priceRange: '$100–$400', searchTerms: 'Opus One Napa' },
    );
  }

  // Filter by meal affinity if provided
  if (affinity && affinity.weight > 0) {
    const preferred = suggestions.filter(s => affinity.types.includes(s.type));
    const others = suggestions.filter(s => !affinity.types.includes(s.type));
    return [...preferred, ...others.slice(0, 2)];
  }

  // Filter by occasion if provided
  if (occPref) {
    const preferred = suggestions.filter(s => occPref.types.includes(s.type));
    const others = suggestions.filter(s => !occPref.types.includes(s.type));
    return [...preferred, ...others.slice(0, 2)];
  }

  return suggestions;
}

export default function SuggestWine() {
  const [budget, setBudget] = useState('');
  const [occasion, setOccasion] = useState('');
  const [meal, setMeal] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  const { wines: cellarWines } = useWines();

  const results = useMemo(() => {
    if (!showResults) return { cellar: [], shop: [] };

    const budgetNum = parseFloat(budget) || 0;

    // Score and sort cellar wines
    const scored = cellarWines
      .map(wine => ({
        wine,
        score: scoreCellarWine(wine, { budget: budgetNum, occasion, meal }),
      }))
      .filter(s => s.score > -50)
      .sort((a, b) => b.score - a.score);

    const cellar = scored.slice(0, 6).map(s => s.wine);
    const shop = getShopSuggestions(budgetNum, occasion, meal);

    return { cellar, shop };
  }, [showResults, budget, occasion, meal, cellarWines, shuffleKey]);

  const handleSuggest = () => {
    setShowResults(true);
  };

  const handleShuffle = () => {
    setShuffleKey(k => k + 1);
    setShowResults(true);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-purple-900 via-burgundy to-pink-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 text-sm">
            <ArrowLeft size={16} /> Back to Collection
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Sparkles size={28} /> Suggest a Wine for Tonight
          </h1>
          <p className="text-white/70 mt-1">Tell us your budget, occasion, and meal — we'll pick the perfect bottle</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Budget Input */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <label className="flex items-center gap-2 text-lg font-semibold text-stone-800 mb-3">
            <DollarSign size={20} className="text-green-600" />
            What's your budget?
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-lg">$</span>
            <input
              type="number"
              min="0"
              step="5"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="e.g. 50"
              className="w-full pl-10 pr-4 py-3 text-lg border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>
          <div className="flex gap-2 mt-3">
            {[15, 25, 50, 100].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setBudget(String(amt))}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  budget === String(amt)
                    ? 'bg-purple-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <label className="flex items-center gap-2 text-lg font-semibold text-stone-800 mb-3">
            <Wine size={20} className="text-purple-600" />
            What's the occasion?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OCCASIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setOccasion(occasion === o.value ? '' : o.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  occasion === o.value
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span>{o.icon}</span>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meal */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <label className="flex items-center gap-2 text-lg font-semibold text-stone-800 mb-3">
            <UtensilsCrossed size={20} className="text-orange-600" />
            What are you eating?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MEAL_TYPES.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMeal(meal === m.value ? '' : m.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  meal === m.value
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Suggest Button */}
        <button
          onClick={handleSuggest}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
        >
          <Sparkles size={22} />
          {showResults ? 'Update Suggestions' : 'Suggest a Wine'}
        </button>

        {/* Results */}
        {showResults && (
          <div className="space-y-6 animate-in">
            {/* From Your Cellar */}
            {results.cellar.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-burgundy/5 to-purple-50 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                      <Wine size={20} className="text-burgundy" />
                      From Your Collection
                    </h2>
                    <p className="text-sm text-stone-500">Wines you already own that fit tonight</p>
                  </div>
                  <button
                    onClick={handleShuffle}
                    className="p-2 rounded-lg hover:bg-white/80 text-stone-500 hover:text-stone-700 transition-colors"
                    title="Shuffle suggestions"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <div className="divide-y divide-stone-100">
                  {results.cellar.map(wine => {
                    let windowLabel = null;
                    if (wine.drinkFrom && wine.drinkTo) {
                      if (currentYear < wine.drinkFrom) windowLabel = { text: 'Not ready yet', cls: 'text-blue-600 bg-blue-50' };
                      else if (currentYear > wine.drinkTo) windowLabel = { text: 'Past peak', cls: 'text-stone-500 bg-stone-100' };
                      else {
                        const mid = (wine.drinkFrom + wine.drinkTo) / 2;
                        if (Math.abs(currentYear - mid) <= 2) windowLabel = { text: 'Peak drinking!', cls: 'text-green-700 bg-green-50 font-semibold' };
                        else windowLabel = { text: 'Ready to drink', cls: 'text-green-600 bg-green-50' };
                      }
                    }

                    return (
                      <Link
                        key={wine.id}
                        to={`/wine/${wine.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
                      >
                        <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                          {wine.imageData ? (
                            <img src={wine.imageData} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <WineBottle type={wine.type} size={28} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-stone-800 truncate">{wine.name}</h3>
                            <WineTypeIcon type={wine.type} size="sm" />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-stone-500 mt-0.5">
                            {wine.vintage && <span>{wine.vintage}</span>}
                            {wine.region && <span>· {wine.region}</span>}
                            {wine.bottles && <span>· {wine.bottles} btl</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {wine.rating && <StarRating rating={wine.rating} readonly size={13} />}
                            {windowLabel && (
                              <span className={`text-[11px] px-2 py-0.5 rounded-full ${windowLabel.cls}`}>
                                {windowLabel.text}
                              </span>
                            )}
                            {wine.purchasePrice && (
                              <span className="text-xs text-stone-400">${wine.purchasePrice}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shop Suggestions */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-stone-100">
                <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <ShoppingCart size={20} className="text-green-600" />
                  {results.cellar.length > 0 ? 'Or Pick Up Something New' : 'Wines to Pick Up Tonight'}
                </h2>
                <p className="text-sm text-stone-500">
                  {budget ? `Suggestions within your $${budget} budget` : 'Top picks for tonight'}
                </p>
              </div>
              <div className="divide-y divide-stone-100">
                {results.shop.map((suggestion, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <WineTypeIcon type={suggestion.type} size="sm" />
                          <h3 className="font-semibold text-stone-800">{suggestion.name}</h3>
                          <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                            {suggestion.priceRange}
                          </span>
                        </div>
                        <p className="text-sm text-stone-500 mt-1">{suggestion.reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <a
                        href={`https://www.lcbo.com/en/search?searchTerm=${encodeURIComponent(suggestion.searchTerms)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                      >
                        LCBO <ExternalLink size={12} />
                      </a>
                      <a
                        href={`https://www.vintages.com/search/?q=${encodeURIComponent(suggestion.searchTerms)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                      >
                        Vintages <ExternalLink size={12} />
                      </a>
                      <a
                        href={`https://www.wine-searcher.com/find/${encodeURIComponent(suggestion.searchTerms)}/1/ontario`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                      >
                        Wine-Searcher <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Food pairing tip */}
            {meal && meal !== 'none' && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-6">
                <h3 className="font-semibold text-stone-800 flex items-center gap-2 mb-2">
                  👨‍🍳 Pairing Tip
                </h3>
                <p className="text-sm text-stone-600">
                  {meal === 'steak' && 'Bold red wines with firm tannins cut through the richness of red meat. Cabernet Sauvignon, Malbec, and Syrah are classic matches.'}
                  {meal === 'poultry' && 'Chicken and poultry are versatile — lighter reds like Pinot Noir or medium-bodied whites like Chardonnay both work beautifully.'}
                  {meal === 'seafood' && 'The key with fish is matching weight: crisp whites for delicate fish, fuller whites for rich seafood like lobster. Avoid heavy reds that overpower.'}
                  {meal === 'pasta' && 'Match the sauce, not the pasta: tomato-based → Sangiovese, cream-based → Chardonnay, pesto → Vermentino, meat ragu → Nebbiolo.'}
                  {meal === 'asian' && 'Off-dry Riesling and aromatic whites handle spice beautifully. The slight sweetness tames heat while bright acidity lifts the flavors.'}
                  {meal === 'cheese' && 'Classic rule: pair regional wines with regional cheeses. Hard aged cheeses love bold reds; soft creamy cheeses love crisp whites or sparkling.'}
                  {meal === 'vegetarian' && 'Earthy vegetables pair beautifully with lighter reds (Pinot Noir, Grenache) and aromatic whites (Sauvignon Blanc, Viognier).'}
                  {meal === 'dessert' && 'The wine should be sweeter than the dessert. Sauternes with crème brûlée, Moscato with fruit, Port with chocolate.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
