'use client';

import { useEffect, useRef } from 'react';
import mapboxgl, { Map as MapboxMap, MapLayerMouseEvent } from 'mapbox-gl';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;
const INITIAL_LNG = 20.46;
const INITIAL_LAT = 44.81;
const INITIAL_ZOOM = 13;

type Venue = {
  id: string;
  name: string;
  type: 'cafe' | 'pub' | 'restaurant';
  location: { lng: number; lat: number };
  address: string;
  rating: number;
  hasOutdoorSeating: boolean;
};

type VenueFeature = GeoJSON.Feature<GeoJSON.Point, Omit<Venue, 'location'>>;

export function useMapbox(
  initialVenues: Venue[],
  setMapError: React.Dispatch<React.SetStateAction<string | null>>,
  overrideTime?: Date
) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    if (!MAPBOX_ACCESS_TOKEN) {
      setMapError('Mapbox access token is missing.');
      return;
    }
    try {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/standard',
        center: [INITIAL_LNG, INITIAL_LAT],
        zoom: INITIAL_ZOOM,
        pitch: 60,
        accessToken: MAPBOX_ACCESS_TOKEN
      });
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map.');
      return;
    }
    const map = mapRef.current;

    map.on('load', () => {
      // Add venues source & layer
      const venuesGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point, Omit<Venue, 'location'>> = {
        type: 'FeatureCollection',
        features: initialVenues.map(v => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [v.location.lng, v.location.lat] },
          properties: { id: v.id, name: v.name, address: v.address, type: v.type, rating: v.rating, hasOutdoorSeating: v.hasOutdoorSeating }
        }))
      };
      map.addSource('venues', { type: 'geojson', data: venuesGeoJSON });
      map.addLayer({
        id: 'venues-layer', type: 'symbol', source: 'venues',
        layout: {
          'icon-image': ['match', ['get', 'type'], 'cafe', 'cafe-15', 'pub', 'beer-15', 'restaurant', 'restaurant-15', 'marker-15'],
          'icon-size': 1.5, 'icon-allow-overlap': true,
          'text-field': ['get', 'name'], 'text-font': ['Open Sans Semibold','Arial Unicode MS Bold'],
          'text-offset': [0,1.25], 'text-anchor':'top','text-size':12,'text-allow-overlap':false
        },
        paint: {'text-color':'#000','text-halo-color':'#fff','text-halo-width':1}
      });

      // Popups
      map.on('click','venues-layer',(e: MapLayerMouseEvent)=>{
        const feature = e.features?.[0] as VenueFeature | undefined;
        if (!feature) return;
        const coords = feature.geometry.coordinates as [number, number];
        const p = feature.properties;
        new mapboxgl.Popup({ offset:25, closeButton:false})
          .setLngLat(coords)
          .setHTML(`<strong>${p.name}</strong><p>${p.address}</p><p>Rating: ${p.rating.toFixed(1)}</p>`)
          .addTo(map);
      });
      map.on('mouseenter','venues-layer',()=>map.getCanvas().style.cursor='pointer');
      map.on('mouseleave','venues-layer',()=>map.getCanvas().style.cursor='');
    });

    const handleResize = () => mapRef.current?.resize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (animationFrameId.current !== null) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initialVenues, setMapError]);

  // Handle sun light: animate if no overrideTime, or set static light when overrideTime changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    // cancel any previous animation
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    // helper to apply light using the new setLights API
    const applyLight = (time: Date) => {
      const hours = time.getHours() + time.getMinutes() / 60 + time.getSeconds() / 3600;
      const azimuth = (hours / 24) * 360 + 90;
      const polar = Math.max(0, Math.sin((hours / 24) * Math.PI) * 90);
      map.setLight({ position: [1.5, azimuth, polar] });
    };
    // start the animation loop
    const startAnimation = () => {
      const animate = () => {
        applyLight(new Date());
        animationFrameId.current = requestAnimationFrame(animate);
      };
      animationFrameId.current = requestAnimationFrame(animate);
    };
    // choose static or animated mode
    const start = () => {
      if (overrideTime) {
        applyLight(overrideTime);
      } else {
        startAnimation();
      }
    };
    // defer until style is loaded
    if (map.isStyleLoaded()) {
      start();
    } else {
      map.once('load', start);
    }
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [overrideTime]);

  return { mapContainerRef, mapRef };
} 