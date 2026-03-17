import { useState, useEffect } from 'react';
import { X, Share, Plus } from 'lucide-react';

export default function AddToHomeScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari when not already in standalone mode
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || navigator.standalone;
    const dismissed = localStorage.getItem('a2hs-dismissed');

    if (isIOS && !isStandalone && !dismissed) {
      // Delay slightly so it doesn't flash on load
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('a2hs-dismissed', Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 animate-slide-up">
      <div className="bg-stone-800 text-white rounded-2xl p-4 shadow-2xl max-w-sm mx-auto relative">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-stone-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="font-semibold text-lg mb-2">Add Liquidity to Home Screen</p>
        <p className="text-stone-300 text-sm mb-3">
          Get the full app experience — quick access from your home screen.
        </p>

        <div className="flex items-center gap-3 text-sm text-stone-300">
          <span className="flex items-center gap-1">
            1. Tap <Share className="w-4 h-4 text-blue-400 inline" />
          </span>
          <span className="flex items-center gap-1">
            2. Tap <span className="text-white font-medium">"Add to Home Screen"</span> <Plus className="w-4 h-4 text-blue-400 inline" />
          </span>
        </div>
      </div>
    </div>
  );
}
