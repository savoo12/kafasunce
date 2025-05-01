'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl, { Map as MapboxMap, Marker } from 'mapbox-gl';
import VenuesList from './components/VenuesList';
import MapboxSearch from './components/MapboxSearch';
import VenueRecommendations from './components/VenueRecommendations';
import { WeatherData } from './components/WeatherService';
import { fetchWeatherData } from './services/WeatherAPI';

// Use the public Mapbox token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2F2bzEyMzQ1NiIsImEiOiJjbWE1dTRrdHMwbGxpMnVzaTR1dW40OWFqIn0._YHOygbBwTmRzYsKFHpi8A';
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

// Define the venue type
interface Venue {
  id: string;
  name: string;
  type: 'cafe' | 'pub' | 'restaurant';
  location: {
    lng: number;
    lat: number;
  };
  address: string;
  rating: number;
  hasOutdoorSeating: boolean;
  weather?: {
    temperature: number;
    condition: string;
    isSunny: boolean;
  };
}

const INITIAL_LNG = 20.46;
const INITIAL_LAT = 44.81;
const INITIAL_ZOOM = 13;

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | undefined>(undefined);
  
  // Store markers in a ref to persist between renders
  const venueMarkers = useRef<{ [id: string]: Marker }>({});
  const activeMarker = useRef<Marker | null>(null);

  // Fetch initial data (venues and weather)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // MOCK DATA - Replace with real API call later
        const mockVenues: Omit<Venue, 'weather'>[] = [
          {
            id: '1',
            name: 'Kafeterija',
            type: 'cafe',
            location: { lng: 20.4612, lat: 44.8186 },
            address: 'Kralja Petra 16, Belgrade',
            rating: 4.7,
            hasOutdoorSeating: true
          },
          {
            id: '2',
            name: 'Miners Pub',
            type: 'pub',
            location: { lng: 20.4583, lat: 44.8172 },
            address: 'Rige od Fere 16, Belgrade',
            rating: 4.5,
            hasOutdoorSeating: true
          },
          {
            id: '3',
            name: 'Aviator Coffee',
            type: 'cafe',
            location: { lng: 20.4548, lat: 44.8138 },
            address: 'Bulevar Kralja Aleksandra 32, Belgrade',
            rating: 4.8,
            hasOutdoorSeating: true
          },
          {
            id: '4',
            name: 'Blaznavac',
            type: 'pub',
            location: { lng: 20.4632, lat: 44.8079 },
            address: 'Kneginje Ljubice 18, Belgrade',
            rating: 4.6,
            hasOutdoorSeating: true
          },
          {
            id: '5',
            name: 'Greenet',
            type: 'cafe',
            location: { lng: 20.4656, lat: 44.8141 },
            address: 'Nušićeva 3, Belgrade',
            rating: 4.9,
            hasOutdoorSeating: false
          }
        ];
        
        // Fetch weather data for each venue (consider doing this on demand later)
        const venuesWithWeather = await Promise.all(
          mockVenues.map(async (venue) => {
            const weather = await fetchWeatherData(venue.location.lat, venue.location.lng);
            return { 
              ...venue, 
              weather: {
                temperature: weather.temperature,
                condition: weather.condition,
                isSunny: weather.isSunny
              }
            };
          })
        );
        setVenues(venuesWithWeather);
        
        // Get current weather for the city center
        const belgradeWeather = await fetchWeatherData(INITIAL_LAT, INITIAL_LNG);
        setCurrentWeather(belgradeWeather);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    
    fetchInitialData();
  }, []); // Run only once on mount

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    if (!mapboxgl.accessToken) {
      console.error("Mapbox access token is not set!");
      setLoading(false);
      return;
    }

    setLoading(true);
    const isMobile = window.innerWidth <= 768; // Check initial screen size

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [INITIAL_LNG, INITIAL_LAT],
      zoom: INITIAL_ZOOM,
      accessToken: MAPBOX_ACCESS_TOKEN,
      // Mobile optimizations
      touchZoomRotate: true,
      dragRotate: false // Often better UX on mobile
    });

    // Add touch-friendly navigation controls
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), isMobile ? 'bottom-right' : 'top-right');
    
    map.current.on('load', () => {
      setLoading(false);
      // Optimize zoom for mobile
      if (isMobile) {
        map.current?.setMaxZoom(17);
      }
    });
    
    // Resize handler
    const handleResize = () => {
      map.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      map.current?.remove();
      map.current = null;
    };
  }, []); // Run only once on mount
  
  // Function to add a single venue marker (memoized)
  const addVenueMarker = useCallback((venue: Venue) => {
    if (!map.current) return;

    const color = venue.weather?.isSunny ? '#FFCC00' : (venue.type === 'cafe' ? '#4A90E2' : '#9A62B3');
    const popupHTML = `
      <h3 class="font-bold">${venue.name}</h3>
      <p>${venue.address}</p>
      <p>${venue.type} ${venue.hasOutdoorSeating ? '• Outdoor Seating' : ''}</p>
      ${venue.weather ? `<p>${venue.weather.temperature}°C - ${venue.weather.condition}</p>` : ''}
    `;

    const marker = new mapboxgl.Marker({ color })
      .setLngLat([venue.location.lng, venue.location.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML))
      .addTo(map.current);

    venueMarkers.current[venue.id] = marker; // Store marker instance
  }, []);

  // Update markers when venues data changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const currentMarkerIds = Object.keys(venueMarkers.current);
    const venueIds = new Set(venues.map(v => v.id));

    // Remove markers for venues that are no longer in the list
    currentMarkerIds.forEach(markerId => {
      if (!venueIds.has(markerId)) {
        venueMarkers.current[markerId]?.remove();
        delete venueMarkers.current[markerId];
      }
    });

    // Add markers for new venues
    venues.forEach(venue => {
      if (!venueMarkers.current[venue.id]) {
        addVenueMarker(venue);
      }
    });

  }, [venues, addVenueMarker]); // Depend on venues and the memoized add function
  
  // Handle selecting a venue (from list or search)
  const handleSelectVenue = useCallback((venue: Venue) => {
    if (!map.current) return;
    
    // Remove previous active marker effect if exists
    if (activeMarker.current) {
      activeMarker.current.getElement().style.transform = ''; // Reset scale
      activeMarker.current.getPopup()?.remove(); // Close popup explicitly
    }
    
    // Get or create the marker for the selected venue
    let marker = venueMarkers.current[venue.id];
    if (!marker) {
      // If marker doesn't exist for some reason, create it
      addVenueMarker(venue);
      marker = venueMarkers.current[venue.id];
      if (!marker) return; // Still couldn't create it, bail out
    }

    // Apply active effect (e.g., scale) and open popup
    marker.getElement().style.transform = 'scale(1.2)'; // Example effect
    marker.togglePopup();
    
    // Store the new active marker
    activeMarker.current = marker;
    
    // Fly to the venue location
    map.current.flyTo({
      center: [venue.location.lng, venue.location.lat],
      zoom: 16,
      essential: true
    });
  }, [addVenueMarker]); // Depend on the memoized add function

  // Handle new venues found from search
  const handleNewVenueFound = useCallback((newVenue: Venue) => {
    const exists = venues.some(v => v.id === newVenue.id);
    if (!exists) {
      // Fetch weather and add to state (which triggers marker update via useEffect)
      fetchWeatherData(newVenue.location.lat, newVenue.location.lng)
        .then(weather => {
          const venueWithWeather = {
            ...newVenue,
            weather: {
              temperature: weather.temperature,
              condition: weather.condition,
              isSunny: weather.isSunny
            }
          };
          setVenues(prev => [...prev, venueWithWeather]);
          // Select the newly added venue
          handleSelectVenue(venueWithWeather);
        })
        .catch(error => {
          console.error("Error fetching weather for new venue:", error);
          // Add venue without weather data and select it
          setVenues(prev => [...prev, newVenue]); 
          handleSelectVenue(newVenue);
        });
    } else {
      // If venue exists, just select it
      const existingVenue = venues.find(v => v.id === newVenue.id);
      if (existingVenue) {
        handleSelectVenue(existingVenue);
      }
    }
  }, [venues, handleSelectVenue]); // Depend on venues and selection handler

  // Main component return JSX
  return (
    // Main container takes full viewport height and prevents overflow
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header (Mobile Only) */}
      <header className="p-4 bg-white dark:bg-slate-800 shadow-md md:hidden flex-shrink-0">
        <h1 className="text-xl font-bold truncate">Belgrade Venues & Weather</h1>
        {currentWeather && (
          <span className="ml-2 text-xs">
            {currentWeather.temperature}°C, {currentWeather.condition}
          </span>
        )}
      </header>
      
      {/* Main content area using flex */}
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
      
        {/* Sidebar (Scrollable) */}
        <div className="w-full md:w-96 h-1/2 md:h-full overflow-y-auto p-4 border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 order-2 md:order-1">
          {/* Desktop Header (Hidden on Mobile) */}
          <header className="hidden md:block pb-4 border-b mb-4">
            <h1 className="text-2xl font-bold">Belgrade Venues & Weather</h1>
            {currentWeather && (
              <span className="ml-1 text-sm">
                ({currentWeather.temperature}°C, {currentWeather.condition})
              </span>
            )}
          </header>
          
          <VenuesList venues={venues} onSelectVenue={handleSelectVenue} /> 
          <VenueRecommendations 
            venues={venues} 
            currentWeather={currentWeather}
            onSelectVenue={handleSelectVenue}
          />
        </div>
        
        {/* Map Area (Takes remaining space, relative for overlays) */}
        <div className="relative flex-grow h-1/2 md:h-full order-1 md:order-2">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-70 pointer-events-none">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-3 text-gray-800">Loading map...</p>
              </div>
            </div>
          )}
          {/* Map and Search Container */}
          <div className="absolute inset-0 z-10"> 
            <MapboxSearch mapRef={map} onSelectVenue={handleNewVenueFound} />
            <div ref={mapContainer} className="map-container" /> 
          </div>
        </div>
        
      </div>
    </div>
  );
}
