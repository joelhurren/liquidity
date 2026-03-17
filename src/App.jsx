import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './pages/Dashboard';
import AddWine from './pages/AddWine';
import WineDetail from './pages/WineDetail';
import EditWine from './pages/EditWine';
import SuggestWine from './pages/SuggestWine';
import AddToHomeScreen from './components/AddToHomeScreen';

function AuthGuard({ children }) {
  const { user, loading, isOfflineMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-4 border-burgundy border-t-transparent rounded-full" />
      </div>
    );
  }

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
        <AuthGuard>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddWine />} />
            <Route path="/wine/:id" element={<WineDetail />} />
            <Route path="/edit/:id" element={<EditWine />} />
            <Route path="/suggest" element={<SuggestWine />} />
          </Routes>
          <AddToHomeScreen />
        </AuthGuard>
      </BrowserRouter>
    </AuthProvider>
  );
}
