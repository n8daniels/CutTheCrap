'use client';

import { useState, ReactNode } from 'react';

interface Slide {
  title: string;
  subtitle?: string;
  component: ReactNode;
}

interface VisualizationCarouselProps {
  slides: Slide[];
}

export default function VisualizationCarousel({ slides }: VisualizationCarouselProps) {
  const [current, setCurrent] = useState(0);

  if (slides.length === 0) return null;

  const prev = () => setCurrent(c => (c === 0 ? slides.length - 1 : c - 1));
  const next = () => setCurrent(c => (c === slides.length - 1 ? 0 : c + 1));

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-6 lg:px-8 pt-6">
        <button
          onClick={prev}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
          aria-label="Previous visualization"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center flex-1 mx-4">
          <h2 className="text-2xl font-bold text-gray-900">{slides[current].title}</h2>
          {slides[current].subtitle && (
            <p className="text-sm text-gray-500 mt-1">{slides[current].subtitle}</p>
          )}
        </div>

        <button
          onClick={next}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
          aria-label="Next visualization"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === current ? 'bg-primary-600' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="px-6 lg:px-8 py-6">
        {slides[current].component}
      </div>

      {/* Page indicator */}
      <div className="text-center text-xs text-gray-400 pb-4">
        {current + 1} of {slides.length} — use arrows to explore
      </div>
    </section>
  );
}
