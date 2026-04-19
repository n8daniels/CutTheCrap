'use client';

import { useEffect, useState } from 'react';
import LandingHero from './LandingHero';

const STORAGE_KEY = 'cutthecrap-landing-dismissed';

export default function LandingModal() {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setOpen(true);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function handleClose() {
    if (dontShow) {
      localStorage.setItem(STORAGE_KEY, '1');
    }
    setOpen(false);
    document.body.style.overflow = '';
  }

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        {/* Header bar with close */}
        <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-300 font-medium">Why CutTheCrap?</span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
                className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-primary-600 focus:ring-primary-500 focus:ring-offset-gray-900"
              />
              Don&rsquo;t show this again
            </label>
            <button
              onClick={handleClose}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Skip to search
            </button>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Landing content */}
        <div className="bg-white">
          <LandingHero onEnter={handleClose} />
        </div>
      </div>
    </div>
  );
}

export function ShowWhyButton() {
  function show() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
  return (
    <button
      onClick={show}
      className="text-gray-500 hover:text-primary-600 text-sm transition-colors"
    >
      Why CutTheCrap?
    </button>
  );
}
