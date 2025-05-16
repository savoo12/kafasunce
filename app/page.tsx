'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl, { Map as MapboxMap, Marker } from 'mapbox-gl';
import ShadeMap from 'mapbox-gl-shadow-simulator';
import osmtogeojson from 'osmtogeojson';
import * as turf from '@turf/turf';
import VenuesList from './components/VenuesList';
import MapboxSearch from './components/MapboxSearch';
import VenueRecommendations from './components/VenueRecommendations';
import { WeatherData } from './components/WeatherService';
import { fetchWeatherData } from './services/WeatherAPI';
import SunControlPanel from './components/SunControlPanel';

// Use the public Mapbox token via environment variable
// Ensure this is set in your .env.local file for local development
// and in your hosting provider's settings for deployment.
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const SHADEMAP_API_KEY = process.env.NEXT_PUBLIC_SHADEMAP_API_KEY;
// mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN; // Set accessToken directly in Map component

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
  sunHours?: number;  // Total hours of sun exposure for today
}

// Define properties expected in GeoJSON features for type safety
interface VenueProperties {
  id: string;
  name: string;
  type: 'cafe' | 'pub' | 'restaurant';
  address: string;
  rating: number;
  hasOutdoorSeating: boolean;
  isSunny?: boolean;
  temperature?: number;
  condition?: string;
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
  const [controlDate, setControlDate] = useState(new Date());
  const [isRealTime, setIsRealTime] = useState(true);
  const [show24h, setShow24h] = useState(false);
  const shadeMapRef = useRef<ShadeMap | null>(null);
  
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
          // Add more mock venues as needed
        ];
        
        // Fetch weather data for each venue (consider doing this on demand later)
        const venuesWithWeather = await Promise.all(
          mockVenues.map(async (venue) => {
            try {
               const weather = await fetchWeatherData(venue.location.lat, venue.location.lng);
               return { 
                 ...venue, 
                 weather: {
                   temperature: weather.temperature,
                   condition: weather.condition,
                   isSunny: weather.isSunny
                 }
               };
            } catch (weatherError) {
                console.error(`Failed to fetch weather for ${venue.name}:`, weatherError);
                return venue; // Return venue without weather if fetch fails
            }
          })
        );
        setVenues(venuesWithWeather as Venue[]); // Assert type after potential failures
        
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

    // Check if the token is available
    if (!MAPBOX_ACCESS_TOKEN) {
      console.error("Mapbox access token (NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) is not set!");
      alert("Mapbox token is missing. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN environment variable."); // User-friendly alert
      setLoading(false);
      return;
    }

    setLoading(true);
    const isMobile = window.innerWidth <= 768; // Check initial screen size

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // Use the Standard style which supports 3D terrain and buildings
      style: 'mapbox://styles/mapbox/standard', 
      center: [INITIAL_LNG, INITIAL_LAT],
      zoom: INITIAL_ZOOM,
      pitch: 60, // Add initial pitch for 3D view
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
        map.current?.setPitch(45); // Adjust pitch for mobile maybe
      }

      // --- Add 3D lighting and shadows ---
      if (map.current) {
        // Set an initial light configuration using the v3 API structure
        // See: https://docs.mapbox.com/mapbox-gl-js/api/map/#map#setlight
        // Standard style handles shadows based on light automatically
        map.current.setLight({
          anchor: 'map', // Light position relative to the map
          color: 'white', // Ambient light color
          intensity: 0.4, // Ambient light intensity
          position: [1.5, 180, 60] // Initial Directional Light: [radial, azimuthal, polar]
        });
        
        // The directional light properties (like color, intensity) are implicitly 
        // controlled by the style's default settings or can be set via style spec directly.
        // We will only animate the position for the sun effect.

        // Function to animate sun position
        const updateSunPosition = () => {
          if (!map.current) return; // Exit if map is removed

          // Calculate sun position based on time of day
          const now = new Date();
          // Normalize time to a 0-1 cycle over 24 hours
          const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
          // Calculate sun's azimuthal position (horizontal angle)
          // Simple approximation: east at sunrise (6am), south at noon (12pm), west at sunset (6pm)
          const azimuth = (hours / 24) * 360 + 90; // Offset by 90 to have sun rise in east
          // Calculate sun's polar position (vertical angle)
          // Simple approximation: peaks at noon, below horizon at night
          const polar = Math.max(0, Math.sin((hours / 24) * Math.PI) * 90); 

          map.current.setLight({
            // Update only the directional light properties needed
            position: [1.5, azimuth, polar] // Radial, Azimuthal, Polar coordinates for light position
          });

          // Request next frame
          requestAnimationFrame(updateSunPosition);
        }

        // Start the animation
        requestAnimationFrame(updateSunPosition);

        // Add a 3D buildings extrusion layer so buildings cast shadows
        map.current.addLayer({
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', ['get', 'extrude'], 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.7
          }
        });
      }
      // --- End 3D lighting ---

      // Initialize Mapbox GL shadow simulator
      if (map.current) {
        shadeMapRef.current = new ShadeMap({
          date: controlDate,                   // Display shadows for selected date and time
          color: '#000000',                   // Shade color
          opacity: 0.5,                       // Shade opacity
          sunExposure: {                     // Disable grid sun-exposure heatmap
            enabled: false,
            startDate: controlDate,
            endDate: controlDate,
            iterations: 32
          },
          apiKey: SHADEMAP_API_KEY!,          // ShadeMap API key (non-null assertion)
          terrainSource: {                    // DEM terrain source configuration
            tileSize: 256,
            maxZoom: 15,
            _overzoom: 0,                   // Required numeric value for plugin's type
            getSourceUrl: ({ x, y, z }) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
            getElevation: () => 0  // disable terrain shadows
          },
          getFeatures: async () => {
            // Use Mapbox vector tile building features for shadows
            const features = map.current!.querySourceFeatures('composite', {
              sourceLayer: 'building',
              filter: ['==', ['get', 'extrude'], 'true']
            });
            return Promise.resolve(features as any[]);
          }
        });
        shadeMapRef.current.addTo(map.current);
        // Ensure only instantaneous building shadows, no grid
        shadeMapRef.current.setSunExposure(false, { startDate: controlDate, endDate: controlDate, iterations: 32 });
        // Prime initial shadow time
        shadeMapRef.current?.setDate(controlDate);
        // Recompute shadows when map movement ends
        map.current.on('moveend', () => {
          shadeMapRef.current?.setDate(controlDate);
        });
      }

      // The GeoJSON source and layer will be added by the other useEffect hook
      // once the venues data is available and the map is loaded.
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
  
  // NEW: useEffect to manage GeoJSON source and layer for venues
  useEffect(() => {
    // Ensure map is initialized, style loaded, and venues data exists
    if (!map.current || !map.current.isStyleLoaded()) {
        // Optionally, wait for style load if map exists but isn't ready
        if(map.current) {
            map.current.once('styledata', () => {
                // Trigger update again once style is loaded
                // This requires careful state management or might cause loops
                // For simplicity, we rely on venues changing AFTER map loads
            });
        }
        return;
    }
    // If no venues, maybe clear the source? For now, do nothing.
    if (!venues.length && map.current.getSource('venues')) {
        (map.current.getSource('venues') as mapboxgl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
        return;
    }
    if (!venues.length) return;


    const source = map.current.getSource('venues');

    // Convert venues array to GeoJSON FeatureCollection
    const venuesGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point, VenueProperties> = {
      type: 'FeatureCollection',
      features: venues.map(venue => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [venue.location.lng, venue.location.lat] // Lng, Lat order
        },
        properties: {
          id: venue.id,
          name: venue.name,
          address: venue.address,
          type: venue.type,
          rating: venue.rating,
          hasOutdoorSeating: venue.hasOutdoorSeating,
          // Include weather data in properties for popups/styling
          isSunny: venue.weather?.isSunny,
          temperature: venue.weather?.temperature,
          condition: venue.weather?.condition,
        }
      }))
    };

    // If the source already exists, just update its data
    if (source) {
      (source as mapboxgl.GeoJSONSource).setData(venuesGeoJSON);
    } else {
      // Otherwise, add the source and the layer
      map.current.addSource('venues', {
        type: 'geojson',
        data: venuesGeoJSON
      });

      map.current.addLayer({
        id: 'venues-layer',
        type: 'symbol',
        source: 'venues',
        layout: {
          // Use Mapbox Maki icons as placeholders or add custom icons later
          'icon-image': [
             'case',
             ['==', ['get', 'isSunny'], true], 'star-15', // Example: Sunny venues get a star
             ['match', ['get', 'type'],
               'cafe', 'cafe-15',
               'pub', 'beer-15',
               'restaurant', 'restaurant-15',
               'marker-15' // Default fallback icon
             ]
          ],
          'icon-size': 1.5,
          'icon-allow-overlap': true,
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.25],
          'text-anchor': 'top',
          'text-size': 12,
          'text-allow-overlap': false // Avoid label clutter
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.5,
          'text-halo-blur': 1
        }
      });

      // --- Attach Event Listeners (only need to be added once when layer is created) ---

      // Click event for popups
      map.current.on('click', 'venues-layer', (e) => {
         if (!e.features || e.features.length === 0 || !map.current) return;
         const feature = e.features[0];
         const geometry = feature.geometry as GeoJSON.Point; // Type assertion
         const properties = feature.properties as VenueProperties | null; // Type assertion

         if (!properties || !geometry) {
             console.error('Feature data missing for popup:', feature);
             return;
         }
         const coordinates = geometry.coordinates.slice() as [number, number];

         // Ensure coordinates are valid numbers before creating popup
         if (typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
           console.error('Invalid coordinates for popup:', coordinates);
           return;
         }

         // Construct popup HTML using available properties
         const popupHTML = `
           <div class="p-1 max-w-xs">
             <h3 class="font-bold text-base mb-1">${properties.name || 'N/A'}</h3>
             <p class="text-sm text-gray-700 mb-1">${properties.address || ''}</p>
             <p class="text-sm capitalize mb-1">${properties.type}${properties.hasOutdoorSeating ? ' • Outdoor Seating' : ''}</p>
             ${properties.temperature !== undefined ? `<p class="text-sm mb-1">${properties.temperature}°C - ${properties.condition || ''} ${properties.isSunny ? '☀️' : ''}</p>` : ''}
             <p class="text-sm">Rating: ${properties.rating || 'N/A'}</p>
           </div>
         `;

         new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: '240px' })
           .setLngLat(coordinates)
           .setHTML(popupHTML)
           .addTo(map.current);
      });

      // Change cursor to pointer on hover
      map.current.on('mouseenter', 'venues-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      // Change cursor back on leave
      map.current.on('mouseleave', 'venues-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    }

  // }, [venues, map.current]); // Depend on venues and map instance readiness
  // Ensure map.current is stable or handle its potential changes carefully.
  // Checking map.current.isStyleLoaded() inside helps mitigate race conditions.
  }, [venues]); // Primarily react to changes in venues data

  // Sample 24h sun exposure for each venue and attach sunHours property
  useEffect(() => {
    if (!shadeMapRef.current || venues.length === 0) return;
    const sm = shadeMapRef.current!;
    // Today's start and end
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    // Enable 24h sun-exposure mode
    sm.setSunExposure(true, { startDate: start, endDate: end, iterations: 24 });
    // Compute sunHours for each venue
    const updated = venues.map(v => ({
      ...v,
      sunHours: sm.getHoursOfSun(v.location.lng, v.location.lat)
    }));
    setVenues(updated);
    // Return to instantaneous shading
    sm.setSunExposure(false, { startDate: controlDate, endDate: controlDate, iterations: 32 });
  }, [venues]);

  // MODIFIED: Handle selecting a venue (now just flies to location)
  const handleSelectVenue = useCallback((venue: Venue) => {
    if (!map.current) return;
    
    // Fly to the venue location
    map.current.flyTo({
      center: [venue.location.lng, venue.location.lat],
      zoom: 16, // Zoom in closer when selecting
      essential: true // Ensures animation completes
    });
    
    // NOTE: Popup is now handled by the layer's 'click' event,
    // not triggered programmatically here. If needed, it's possible
    // but more complex (queryRenderedFeatures, create Popup manually).
  }, []); // No dependency on addVenueMarker anymore

  // MODIFIED: Handle new venues found from search
  const handleNewVenueFound = useCallback((newVenueData: { id: string; name: string; location: { lng: number; lat: number }; address: string; type: 'cafe' | 'pub' | 'restaurant'; rating: number; hasOutdoorSeating: boolean; }) => {
     // Ensure the venue has all necessary fields, even if weather is missing initially
     const newVenue: Venue = {
         ...newVenueData,
         // Initialize weather as undefined, it will be fetched
         weather: undefined
     };

     const exists = venues.some(v => v.id === newVenue.id);

     if (!exists) {
       // Fetch weather and add to state (which triggers GeoJSON source update via useEffect)
       fetchWeatherData(newVenue.location.lat, newVenue.location.lng)
         .then(weather => {
           const venueWithWeather: Venue = {
             ...newVenue,
             weather: {
               temperature: weather.temperature,
               condition: weather.condition,
               isSunny: weather.isSunny
             }
           };
           setVenues(prev => [...prev, venueWithWeather]);
           // Select (fly to) the newly added venue
           handleSelectVenue(venueWithWeather);
         })
         .catch(error => {
           console.error("Error fetching weather for new venue:", error);
           // Add venue without weather data and select it
           setVenues(prev => [...prev, newVenue]);
           handleSelectVenue(newVenue);
         });
     } else {
       // If venue exists, just select (fly to) it
       const existingVenue = venues.find(v => v.id === newVenue.id);
       if (existingVenue) {
         handleSelectVenue(existingVenue);
       }
     }
  }, [venues, handleSelectVenue]); // Depend on venues and selection handler

  // Update map light when controlDate changes, waiting for style to load if necessary
  useEffect(() => {
    if (!map.current) return;
    const applyLight = () => {
      const h = controlDate.getHours() + controlDate.getMinutes() / 60 + controlDate.getSeconds() / 3600;
      const azimuth = (h / 24) * 360 + 90;
      const polar = Math.max(0, Math.sin((h / 24) * Math.PI) * 90);
      // Update Mapbox style light
      map.current!.setLight({ position: [1.5, azimuth, polar] });
      // Update ShadeMap plugin shadows
      shadeMapRef.current?.setDate(controlDate);
    };
    // If style is ready, apply immediately; otherwise wait for load
    if (map.current.isStyleLoaded()) {
      applyLight();
    } else {
      map.current.once('load', applyLight);
    }
  }, [controlDate]);

  // Main component return JSX
  // Force deploy trigger
  return (
    // Main container takes full viewport height and prevents overflow
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Header (Mobile Only) */}
      <header className="p-3 bg-white dark:bg-slate-800 shadow-md md:hidden flex-shrink-0 flex justify-between items-center">
        <h1 className="text-lg font-semibold truncate text-gray-800 dark:text-gray-100">Belgrade Venues</h1>
        {currentWeather && (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {currentWeather.temperature}°C, {currentWeather.condition}
          </span>
        )}
      </header>
      
      {/* Main content area using flex */}
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
      
        {/* Sidebar (Scrollable) */}
        <div className="w-full md:w-80 lg:w-96 h-1/3 md:h-full overflow-y-auto bg-white dark:bg-slate-800 border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0 order-2 md:order-1 flex flex-col">
           {/* Desktop Header (Hidden on Mobile) */}
           <header className="hidden md:block p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
             <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Belgrade Venues</h1>
             {currentWeather && (
               <span className="text-sm text-gray-600 dark:text-gray-300 block">
                 ({currentWeather.temperature}°C, {currentWeather.condition})
               </span>
             )}
           </header>
           
           {/* Scrollable content within sidebar */}
           <div className="flex-grow overflow-y-auto p-4 space-y-4">
              <VenueRecommendations 
                venues={venues} 
                currentWeather={currentWeather}
                onSelectVenue={handleSelectVenue}
              />
              <VenuesList 
                venues={venues} 
                onSelectVenue={handleSelectVenue} 
              /> 
           </div>
        </div>
        
        {/* Map Area (Takes remaining space, relative for overlays) */}
        <div className="relative flex-grow h-2/3 md:h-full order-1 md:order-2">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 pointer-events-none">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-3 text-gray-800 dark:text-gray-200">Loading map...</p>
              </div>
            </div>
          )}
          {/* Map and Search Container */}
          <div className="absolute inset-0 z-10"> 
            <MapboxSearch mapRef={map} onSelectVenue={handleNewVenueFound} />
            <SunControlPanel
              controlDate={controlDate}
              setControlDate={setControlDate}
              isRealTime={isRealTime}
              setIsRealTime={setIsRealTime}
              show24h={show24h}
              setShow24h={setShow24h}
            />
             {/* Ensure map container takes full space */}
            <div ref={mapContainer} className="absolute inset-0 map-container" /> 
          </div>
        </div>
        
      </div>
    </div>
  );
}

// Add CSS for map-container if not already globally defined
// .map-container {
//   width: 100%;
//   height: 100%;
// }
