import { useState, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Wine, Search, Filter, ArrowUpDown, Grid3X3, List, LogOut, Clock, Star } from 'lucide-react';
import { useWines } from '../hooks/useWines';
import { useAuth } from '../contexts/AuthContext';
import { WINE_TYPES } from '../data/wineData';
import WineTypeIcon from '../components/WineTypeIcon';
import StarRating from '../components/StarRating';
import WineBottle from '../components/WineBottle';

export default function Dashboard() {
  const { wines, loading } = useWines();
  const { user, signOut, isOfflineMode } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [showDrinkNow, setShowDrinkNow] = useState(false);

  const currentYear = new Date().getFullYear();

  // Wines expiring soon (drinkTo within next 2 years) — drink before they go past peak
  const drinkSoonWines = useMemo(() => {
    return wines.filter(
      (w) => w.drinkTo && w.drinkTo <= currentYear + 2 && (w.bottles || 0) > 0
    ).sort((a, b) => (a.drinkTo || 0) - (b.drinkTo || 0)); // most urgent first
  }, [wines, currentYear]);

  const filteredWines = useMemo(() => {
    let result = [...wines];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.producer.toLowerCase().includes(q) ||
          (w.region || '').toLowerCase().includes(q) ||
          (w.country || '').toLowerCase().includes(q) ||
          (w.appellation || '').toLowerCase().includes(q) ||
          (w.classification || '').toLowerCase().includes(q) ||
          (w.type || '').toLowerCase().includes(q) ||
          (w.grapeVarieties || []).some((g) => g.toLowerCase().includes(q)) ||
          (w.storageLocation || '').toLowerCase().includes(q) ||
          (w.vintage && w.vintage.toString().includes(q))
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((w) => w.type === typeFilter);
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'vintage':
        result.sort((a, b) => (b.vintage || 0) - (a.vintage || 0));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [wines, search, typeFilter, sortBy]);

  const stats = useMemo(() => {
    const totalBottles = wines.reduce((sum, w) => sum + (w.bottles || 0), 0);
    const winesWithScore = wines.filter((w) => w.communityScore);
    const avgRating = winesWithScore.length > 0
      ? winesWithScore.reduce((sum, w) => sum + w.communityScore, 0) / winesWithScore.length
      : 0;
    const typeBreakdown = {};
    wines.forEach((w) => {
      typeBreakdown[w.type] = (typeBreakdown[w.type] || 0) + (w.bottles || 0);
    });
    return { totalBottles, avgRating, uniqueWines: wines.length, typeBreakdown };
  }, [wines]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-4 border-burgundy border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-br from-burgundy to-burgundy/80 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <Wine size={28} className="sm:w-8 sm:h-8" /> Liquidity
              </h1>
              <p className="text-white/70 mt-1 text-sm sm:text-base">Your personal wine collection</p>
            </div>
            {user && !isOfflineMode && (
              <button
                onClick={signOut}
                className="bg-white/10 backdrop-blur text-white/80 px-3 py-2 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 text-sm border border-white/10"
                title="Sign out"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">{user.user_metadata?.full_name?.split(' ')[0] || 'Sign Out'}</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 mb-6 flex-wrap">
            <Link
              to="/add"
              className="flex-1 sm:flex-none bg-white text-burgundy px-4 sm:px-5 py-2.5 rounded-xl font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
            >
              <Plus size={18} /> Add Wine
            </Link>
            {drinkSoonWines.length > 0 && (
              <button
                onClick={() => setShowDrinkNow(!showDrinkNow)}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${
                  showDrinkNow
                    ? 'bg-amber-400 text-amber-900 shadow-lg'
                    : 'bg-white/15 backdrop-blur text-white hover:bg-white/25 border border-white/20'
                }`}
              >
                <Clock size={18} /> Drink Soon
                <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{drinkSoonWines.length}</span>
              </button>
            )}
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-2xl font-bold">{stats.totalBottles}</div>
              <div className="text-sm text-white/70">Total Bottles</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-2xl font-bold">{stats.uniqueWines}</div>
              <div className="text-sm text-white/70">Unique Wines</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-2xl font-bold">
                {stats.avgRating ? stats.avgRating.toFixed(1) : '—'}
              </div>
              <div className="text-sm text-white/70">Avg Vivino</div>
            </div>
          </div>
        </div>
      </header>

      {/* Drink Now filtered view banner */}
      {showDrinkNow && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-600" />
              <h2 className="font-semibold text-amber-800">
                {drinkSoonWines.length} wine{drinkSoonWines.length !== 1 ? 's' : ''} expiring by {currentYear + 2} — drink soon!
              </h2>
            </div>
            <button
              onClick={() => setShowDrinkNow(false)}
              className="text-sm text-amber-700 hover:text-amber-900 font-medium"
            >
              Show All
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search wines, producers, regions, countries, grapes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Type filter pills */}
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                typeFilter === 'all' ? 'bg-burgundy text-white' : 'bg-white border border-stone-200 hover:bg-stone-50'
              }`}
            >
              All
            </button>
            {WINE_TYPES.slice(0, 4).map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(typeFilter === t.value ? 'all' : t.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  typeFilter === t.value
                    ? 'bg-burgundy text-white'
                    : 'bg-white border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <WineTypeIcon type={t.value} size="sm" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-lg bg-white text-sm"
            >
              <option value="recent">Recently Added</option>
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="vintage">Vintage</option>
            </select>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 border border-stone-200 rounded-lg bg-white hover:bg-stone-50"
            >
              {viewMode === 'grid' ? <List size={18} /> : <Grid3X3 size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Wine grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {(() => {
          const displayWines = showDrinkNow ? drinkSoonWines : filteredWines;
          return displayWines.length === 0 ? (
          <div className="text-center py-16">
            {wines.length === 0 ? (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-stone-100 rounded-full mb-4">
                  <Wine size={36} className="text-stone-400" />
                </div>
                <h2 className="text-xl font-semibold text-stone-700 mb-2">Your collection is empty</h2>
                <p className="text-stone-500 mb-6">
                  Start building your collection by adding your first wine
                </p>
                <Link
                  to="/add"
                  className="inline-flex items-center gap-2 bg-burgundy text-white px-6 py-3 rounded-xl font-semibold hover:bg-burgundy/90"
                >
                  <Plus size={20} /> Add Your First Wine
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-stone-700 mb-2">No wines match your search</h2>
                <p className="text-stone-500">Try adjusting your filters</p>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayWines.map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayWines.map((wine) => (
              <WineListItem key={wine.id} wine={wine} />
            ))}
          </div>
        );
        })()}
      </div>
    </div>
  );
}

const WineCard = memo(function WineCard({ wine }) {
  const currentYear = new Date().getFullYear();
  let windowStatus = null;
  if (wine.drinkFrom && wine.drinkTo) {
    if (currentYear < wine.drinkFrom) windowStatus = { label: 'Too Early', color: 'text-blue-600 bg-blue-50' };
    else if (currentYear > wine.drinkTo) windowStatus = { label: 'Past Peak', color: 'text-stone-500 bg-stone-100' };
    else windowStatus = { label: 'Ready', color: 'text-green-600 bg-green-50' };
  }

  const percentile = wine.qualityPercentile ? 100 - wine.qualityPercentile : null;

  return (
    <Link
      to={`/wine/${wine.id}`}
      className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all group"
    >
      {/* Image or bottle illustration */}
      <div className="h-48 bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center relative overflow-hidden">
        {wine.imageData ? (
          <img src={wine.imageData} alt={wine.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <WineBottle type={wine.type} size={50} className="group-hover:scale-105 transition-transform" />
        )}
        {wine.bottles > 0 && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-semibold px-2 py-1 rounded-full">
            {wine.bottles} bottle{wine.bottles !== 1 ? 's' : ''}
          </span>
        )}
        {wine.bottles === 0 && (
          <span className="absolute top-3 right-3 bg-stone-800/80 text-white text-xs font-semibold px-2 py-1 rounded-full">
            None Left
          </span>
        )}
        {/* Vivino score badge on image */}
        {wine.communityScore && (
          <span className="absolute bottom-3 left-3 bg-burgundy/90 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Star size={10} fill="currentColor" /> {wine.communityScore.toFixed ? wine.communityScore.toFixed(1) : wine.communityScore}
          </span>
        )}
        {percentile && (
          <span className="absolute bottom-3 right-3 bg-amber-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full">
            Top {percentile}%
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start gap-2 mb-1">
          <WineTypeIcon type={wine.type} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-800 truncate">{wine.name || 'Untitled Wine'}</h3>
            <p className="text-sm text-stone-500 truncate">{wine.producer}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
          {wine.vintage && <span className="font-medium">{wine.vintage}</span>}
          {wine.region && <span className="truncate">{wine.region}</span>}
        </div>

        <div className="flex items-center justify-between mt-3">
          {wine.rating ? (
            <StarRating rating={wine.rating} readonly size={16} />
          ) : (
            <span className="text-xs text-stone-400">Not rated</span>
          )}
          {windowStatus && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${windowStatus.color}`}>
              {windowStatus.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

const WineListItem = memo(function WineListItem({ wine }) {
  const percentile = wine.qualityPercentile ? 100 - wine.qualityPercentile : null;

  return (
    <Link
      to={`/wine/${wine.id}`}
      className="bg-white rounded-xl border border-stone-200 p-4 hover:shadow-md transition-all flex items-center gap-4"
    >
      <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
        <WineTypeIcon type={wine.type} size="lg" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-stone-800 truncate">{wine.name || 'Untitled Wine'}</h3>
        <p className="text-sm text-stone-500 truncate">
          {[wine.producer, wine.vintage, wine.region].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {wine.communityScore && (
          <span className="text-xs font-bold text-burgundy flex items-center gap-0.5">
            <Star size={10} fill="currentColor" /> {wine.communityScore.toFixed ? wine.communityScore.toFixed(1) : wine.communityScore}
          </span>
        )}
        {percentile && (
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
            Top {percentile}%
          </span>
        )}
        {wine.rating && <StarRating rating={wine.rating} readonly size={14} />}
        <span className="text-sm text-stone-500 font-medium">{wine.bottles} btl</span>
      </div>
    </Link>
  );
});
