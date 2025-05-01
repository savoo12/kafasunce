'use client';

import { useEffect, useState } from 'react';
import { WeatherData } from './WeatherService';
import { fetchWeatherData } from '../services/WeatherAPI';

interface VenueDetailProps {
  venue: {
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
    photos?: string[];
    openingHours?: {
      [key: string]: { open: string; close: string };
    };
  } | null;
  onClose: () => void;
}

const daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function VenueDetail({ venue, onClose }: VenueDetailProps) {
  const [weatherForecast, setWeatherForecast] = useState<WeatherData[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'weather' | 'photos'>('info');
  
  useEffect(() => {
    if (!venue) return;
    
    // Fetch current weather data
    const fetchWeather = async () => {
      try {
        // For a real app, fetch 5-day forecast from a weather API
        // For demo, create mock forecast data
        const currentWeather = await fetchWeatherData(venue.location.lat, venue.location.lng);
        
        // Create fake forecast for the next 4 days
        const forecast: WeatherData[] = [currentWeather];
        
        for (let i = 1; i <= 4; i++) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + i);
          
          // Slightly vary the weather for each day
          const tempVariation = Math.round(Math.random() * 6) - 3; // -3 to +3 degrees
          const isSunny = Math.random() > 0.3; // 70% chance of sun
          
          forecast.push({
            temperature: currentWeather.temperature + tempVariation,
            condition: isSunny ? 'Sunny' : 'Partly Cloudy',
            isSunny,
            precipitation: isSunny ? 0 : Math.round(Math.random() * 30),
            humidity: 40 + Math.round(Math.random() * 40),
            windSpeed: Math.round(Math.random() * 15),
            date: tomorrow.toISOString().split('T')[0]
          });
        }
        
        setWeatherForecast(forecast);
      } catch (error) {
        console.error('Error fetching weather forecast:', error);
      }
    };
    
    fetchWeather();
  }, [venue]);
  
  if (!venue) return null;
  
  // Get current day for highlighting in opening hours
  const currentDay = daysOfWeek[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden w-full max-w-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{venue.name}</h2>
              <p className="text-gray-600 dark:text-gray-300">{venue.address}</p>
              <div className="flex items-center mt-2">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                  {venue.type.charAt(0).toUpperCase() + venue.type.slice(1)}
                </span>
                {venue.hasOutdoorSeating && (
                  <span className="ml-2 px-2 py-1 rounded bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-sm">
                    Outdoor Seating
                  </span>
                )}
                <div className="ml-2 flex items-center text-yellow-500">
                  <span className="mr-1">{venue.rating.toFixed(1)}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Weather preview */}
          {venue.weather && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center">
                <div className={`text-2xl font-bold ${venue.weather.isSunny ? 'text-yellow-500' : 'text-gray-500'}`}>
                  {venue.weather.temperature}°C
                </div>
                <div className="ml-2 text-gray-600 dark:text-gray-300">
                  {venue.weather.condition}
                </div>
                {venue.weather.isSunny && venue.hasOutdoorSeating && (
                  <div className="ml-auto px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 rounded text-sm">
                    Perfect for outdoor seating now!
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tabs */}
          <div className="flex space-x-4 mt-4 border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
            <button
              className={`pb-2 px-1 ${activeTab === 'info' 
                ? 'text-blue-500 border-b-2 border-blue-500 font-medium' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              onClick={() => setActiveTab('info')}
            >
              Information
            </button>
            <button
              className={`pb-2 px-1 ${activeTab === 'weather' 
                ? 'text-blue-500 border-b-2 border-blue-500 font-medium' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
              onClick={() => setActiveTab('weather')}
            >
              Weather Forecast
            </button>
            {venue.photos && venue.photos.length > 0 && (
              <button
                className={`pb-2 px-1 ${activeTab === 'photos' 
                  ? 'text-blue-500 border-b-2 border-blue-500 font-medium' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                onClick={() => setActiveTab('photos')}
              >
                Photos
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Information Tab */}
          {activeTab === 'info' && (
            <div>
              <h3 className="font-medium text-lg mb-2">Opening Hours</h3>
              {venue.openingHours ? (
                <div className="space-y-1">
                  {daysOfWeek.map((day, index) => (
                    <div 
                      key={day} 
                      className={`flex justify-between ${currentDay === day ? 'font-medium text-blue-600 dark:text-blue-400' : ''}`}
                    >
                      <span>{dayLabels[index]}</span>
                      {venue.openingHours && venue.openingHours[day] ? (
                        <span>{venue.openingHours[day].open} - {venue.openingHours[day].close}</span>
                      ) : (
                        <span>Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Opening hours not available</p>
              )}
              
              <h3 className="font-medium text-lg mt-6 mb-2">Location</h3>
              <p className="text-gray-800 dark:text-gray-200">{venue.address}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Coordinates: {venue.location.lat.toFixed(4)}, {venue.location.lng.toFixed(4)}
              </p>
              
              <div className="mt-6">
                <h3 className="font-medium text-lg mb-2">Features</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                    {venue.type === 'cafe' ? 'Coffee' : 'Drinks'}
                  </span>
                  {venue.hasOutdoorSeating && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-full text-sm">
                      Terrace
                    </span>
                  )}
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 rounded-full text-sm">
                    Wi-Fi
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Weather Forecast Tab */}
          {activeTab === 'weather' && (
            <div>
              <h3 className="font-medium text-lg mb-4">5-Day Weather Forecast</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {weatherForecast.map((day, index) => {
                  const date = day.date 
                    ? new Date(day.date) 
                    : new Date(new Date().setDate(new Date().getDate() + index));
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg ${index === 0 
                        ? 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800' 
                        : 'bg-gray-50 dark:bg-slate-700'}`}
                    >
                      <div className="text-sm font-medium mb-2">
                        {index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-2xl font-bold ${day.isSunny ? 'text-yellow-500' : 'text-gray-500'}`}>
                        {day.temperature}°C
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{day.condition}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <div>Humidity: {day.humidity}%</div>
                        <div>Wind: {day.windSpeed} km/h</div>
                        {day.precipitation > 0 && <div>Rain: {day.precipitation}%</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                <h4 className="font-medium mb-2">Outdoor Seating Recommendation</h4>
                {weatherForecast.length > 0 && weatherForecast[0].isSunny && venue.hasOutdoorSeating ? (
                  <p className="text-gray-800 dark:text-gray-200">
                    Great day to enjoy {venue.name}'s outdoor seating area! Currently sunny and {weatherForecast[0].temperature}°C.
                  </p>
                ) : venue.hasOutdoorSeating ? (
                  <p className="text-gray-800 dark:text-gray-200">
                    Outdoor seating is available, but the weather might not be ideal right now.
                  </p>
                ) : (
                  <p className="text-gray-800 dark:text-gray-200">
                    This venue doesn't have outdoor seating, but it's a great place to enjoy indoors!
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Photos Tab */}
          {activeTab === 'photos' && venue.photos && (
            <div>
              <h3 className="font-medium text-lg mb-4">Photos</h3>
              <div className="grid grid-cols-2 gap-4">
                {venue.photos.map((photo, index) => (
                  <div key={index} className="rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 h-40">
                    <img 
                      src={photo} 
                      alt={`${venue.name} - ${index + 1}`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback for missing images
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Close
          </button>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${venue.location.lat},${venue.location.lng}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Directions
          </a>
        </div>
      </div>
    </div>
  );
} 