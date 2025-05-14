'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;
const INITIAL_LNG = 20.46;
const INITIAL_LAT = 44.81;
const INITIAL_ZOOM = 13;

export interface Venue {
  id: string;
  name: string;
  type: 'cafe' | 'pub' | 'restaurant';
  location: { lng: number; lat: number };
  address: string;
  rating: number;
  hasOutdoorSeating: boolean;
  weather?: {
    temperature: number;
    condition: string;
    isSunny: boolean;
  };
}

export interface CityWeather {
  temperature: number;
  condition: string;
  isSunny: boolean;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

interface HomeClientProps {
  initialVenues: Venue[];
  initialCityWeather: CityWeather;
}

export default function HomeClient({ initialVenues, initialCityWeather }: HomeClientProps) {
  const [venues] = useState<Venue[]>(initialVenues);
  const [currentWeather] = useState<CityWeather>(initialCityWeather);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    if (!MAPBOX_ACCESS_TOKEN) {
      console.error('Mapbox token is missing');
      return;
    }

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [INITIAL_LNG, INITIAL_LAT],
      zoom: INITIAL_ZOOM,
      pitch: 60,
      accessToken: MAPBOX_ACCESS_TOKEN
    });

    mapRef.current.on('load', () => {
      // Start sun animation loop
      const updateSunPosition = () => {
        if (!mapRef.current) return;
        const now = new Date();
        const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
        const azimuth = (hours / 24) * 360 + 90;
        const polar = Math.max(0, Math.sin((hours / 24) * Math.PI) * 90);
        mapRef.current.setLight({ position: [1.5, azimuth, polar] });
        animationFrameId.current = requestAnimationFrame(updateSunPosition);
      };
      animationFrameId.current = requestAnimationFrame(updateSunPosition);

      // --- Add venues layer after style load ---
      const venuesGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: venues.map(venue => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [venue.location.lng, venue.location.lat] },
          properties: {
            id: venue.id,
            name: venue.name,
            address: venue.address,
            type: venue.type,
            rating: venue.rating,
            hasOutdoorSeating: venue.hasOutdoorSeating
          }
        }))
      };
      mapRef.current!.addSource('venues', { type: 'geojson', data: venuesGeoJSON });
      mapRef.current!.addLayer({
        id: 'venues-layer',
        type: 'symbol',
        source: 'venues',
        layout: {
          'icon-image': ['match', ['get', 'type'], 'cafe', 'cafe-15', 'pub', 'beer-15', 'restaurant', 'restaurant-15', 'marker-15'],
          'icon-size': 1.5,
          'icon-allow-overlap': true,
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.25],
          'text-anchor': 'top',
          'text-size': 12,
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#000',
          'text-halo-color': '#fff',
          'text-halo-width': 1
        }
      });
      // Popups and cursor events
      mapRef.current!.on('click', 'venues-layer', e => {
        if (!e.features || !e.features.length) return;
        const feature = e.features[0];
        const coords = ((feature.geometry as any).coordinates as number[]).slice() as [number, number];
        const props = feature.properties as any;
        const html = `<strong>${props.name}</strong><p>${props.address}</p><p>Rating: ${props.rating}</p>`;
        new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(mapRef.current!);
      });
      mapRef.current!.on('mouseenter', 'venues-layer', () => {
        mapRef.current!.getCanvas().style.cursor = 'pointer';
      });
      mapRef.current!.on('mouseleave', 'venues-layer', () => {
        mapRef.current!.getCanvas().style.cursor = '';
      });
    });

    const handleResize = () => {
      mapRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow relative">
        <div ref={mapContainer} className="absolute inset-0 map-container" />
      </div>
      <div className="p-4 bg-white dark:bg-slate-800">
        <h2 className="text-lg font-semibold">Venues Loaded: {venues.length}</h2>
        <p>Current Temp: {currentWeather.temperature}°C - {currentWeather.condition}</p>
      </div>
    </div>
  );
} 