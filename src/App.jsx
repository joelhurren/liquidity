import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './pages/Dashboard';
import AddToHomeScreen from './components/AddToHomeScreen';
import { migrateImagesToStorage } from './lib/imageStorage';

// Expose migration function for one-time use from browser console
window.migrateImages = migrateImagesToStorage;

// Lazy-load non-dashboard routes to reduce initial bundle
const AddWine = lazy(() => import('./pages/AddWine'));
const WineDetail = lazy(() => import('./pages/WineDetail'));
const EditWine = lazy(() => import('./pages/EditWine'));
const SuggestWine = lazy(() => import('./pages/SuggestWine'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="animate-spin w-8 h-8 border-4 border-burgundy border-t-transparent rounded-full" />
    </div>
  );
}

function AuthGuard({ children }) {
  const { user, loading, isOfflineMode } = useAuth();

  if (loading) return <PageLoader />;

  // In offline mode (no Supabase), skip auth
  if (isOfflineMode) return children;

  // Online mode — require login
  if (!user) return <LoginPage />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<AddWine />} />
              <Route path="/wine/:id" element={<WineDetail />} />
              <Route path="/edit/:id" element={<EditWine />} />
              <Route path="/suggest" element={<SuggestWine />} />
            </Routes>
          </Suspense>
          <AddToHomeScreen />
        </AuthGuard>
      </BrowserRouter>
    </AuthProvider>
  );
}
