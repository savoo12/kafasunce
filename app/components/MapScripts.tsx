'use client';

import Script from 'next/script';

// Loads Mapbox GL JS and Mapbox Search JS, then dispatches an event when Search JS is ready
export default function MapScripts() {
  // Mapbox GL CSS is already loaded in head
  return (
    <>
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
        strategy="beforeInteractive"
      />
      <Script
        id="search-js"
        defer
        src="https://api.mapbox.com/search-js/v1.0.0/web.js"
        strategy="beforeInteractive"
        onLoad={() => window.dispatchEvent(new Event('mapbox-search-loaded'))}
      />
    </>
  );
} 