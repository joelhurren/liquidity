import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  const root = document.getElementById('root');
  console.log('Root element:', root);
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('React mounted');
} catch (err) {
  console.error('Mount error:', err);
  document.getElementById('root').innerHTML = '<pre style="padding:2rem;color:red;">' + err.message + '\n' + err.stack + '</pre>';
}
