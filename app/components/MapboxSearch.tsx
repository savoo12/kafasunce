'use client';

import { useEffect, useRef } from 'react';
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';

// Use the public Mapbox token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2F2bzEyMzQ1NiIsImEiOiJjbWE1dTRrdHMwbGxpMnVzaTR1dW40OWFqIn0._YHOygbBwTmRzYsKFHpi8A';

// Define window augmentation for TypeScript
declare global {
  interface Window {
    mapboxsearch: {
      MapboxSearchBox: any;
    }
  }
}

// Define a type for the venue
interface Venue {
  id: string;
  name: string;
  type: 'cafe' | 'pub' | 'restaurant';
  location: { lng: number; lat: number };
  address: string;
  rating: number;
  hasOutdoorSeating: boolean;
}

interface MapboxSearchProps {
  mapRef: React.RefObject<MapboxMap | null>;
  onSelectVenue: (venue: Venue) => void;
}

export default function MapboxSearch({ mapRef, onSelectVenue }: MapboxSearchProps) {
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchBoxInstance = useRef<any>(null);

  useEffect(() => {
    const checkSearchBoxReady = setInterval(() => {
      if (!window.mapboxsearch || !mapRef.current || !searchBoxRef.current) return;
      
      clearInterval(checkSearchBoxReady);
      if (searchBoxInstance.current) return;
      
      try {
        const searchBox = new window.mapboxsearch.MapboxSearchBox();
        
        searchBox.accessToken = MAPBOX_ACCESS_TOKEN;
        searchBox.options = {
          proximity: [20.46, 44.81],
          countries: ['RS'],
          language: 'en',
          limit: 5 // Limit results for mobile performance
        };
        searchBox.marker = false;
        searchBox.mapboxgl = mapboxgl;
        
        const searchBoxEl = searchBox.onAdd(mapRef.current);
        searchBoxRef.current.innerHTML = '';
        searchBoxRef.current.appendChild(searchBoxEl);
        
        searchBoxInstance.current = searchBox;
        
        searchBox.addEventListener('retrieve', (event: any) => {
          const response = event.detail;
          if (!response?.features || response.features.length === 0) return;
          
          const selectedFeature = response.features[0];
          const coordinates = selectedFeature.geometry?.coordinates;
          if (!coordinates || coordinates.length < 2) return;
          
          const venue: Venue = {
            id: selectedFeature.id || Math.random().toString(36).substring(2, 9),
            name: selectedFeature.properties?.name || 'Unknown Venue',
            type: determineVenueType(selectedFeature.properties?.category || ''),
            location: {
              lng: coordinates[0],
              lat: coordinates[1]
            },
            address: selectedFeature.properties?.address || '',
            rating: 4.5, // Placeholder
            hasOutdoorSeating: false // Placeholder
          };
          
          onSelectVenue(venue);
        });
      } catch (error) {
        console.error("Failed to initialize Mapbox SearchBox:", error);
      }
    }, 100);
    
    return () => {
      clearInterval(checkSearchBoxReady);
      if (searchBoxInstance.current && mapRef.current) {
        try {
          // Use searchBoxInstance.current consistently
          searchBoxInstance.current.onRemove(); 
        } catch (error) {
          console.error("Error removing search box:", error);
        }
        searchBoxInstance.current = null;
      }
    };
  }, [mapRef, onSelectVenue]);
  
  // Helper function to determine venue type
  const determineVenueType = (category: string): 'cafe' | 'pub' | 'restaurant' => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('cafe') || lowerCategory.includes('coffee')) {
      return 'cafe';
    } else if (lowerCategory.includes('pub') || lowerCategory.includes('bar')) {
      return 'pub';
    } else {
      return 'restaurant';
    }
  };

  return (
    // Use responsive Tailwind classes for positioning
    <div className="absolute z-10 w-[calc(100%-2rem)] md:w-auto left-4 right-4 md:left-4 md:right-auto top-auto bottom-4 md:top-4 md:bottom-auto max-w-lg mx-auto md:mx-0">
      <div ref={searchBoxRef} className="w-full"></div>
    </div>
  );
}