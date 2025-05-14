import HomeClient from './components/HomeClient';

export const revalidate = 0; // Always fetch fresh data on each request

const INITIAL_LNG = 20.46;
const INITIAL_LAT = 44.81;

interface Venue {
  id: string;
  name: string;
  type: 'cafe' | 'pub' | 'restaurant';
  location: { lng: number; lat: number };
  address: string;
  rating: number;
  hasOutdoorSeating: boolean;
}

interface CityWeather {
  temperature: number;
  condition: string;
  isSunny: boolean;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

async function fetchCityWeather(): Promise<CityWeather> {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${INITIAL_LAT}&lon=${INITIAL_LNG}&units=metric&appid=${process.env.WEATHER_API_KEY}`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  return {
    temperature: Math.round(data.main.temp),
    condition: data.weather[0].main,
    isSunny: data.weather[0].main.toLowerCase() === 'clear',
    precipitation: data.rain?.['1h'] || 0,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed)
  };
}

export default async function Page() {
  const mockVenues: Venue[] = [
    { id: '1', name: 'Kafeterija', type: 'cafe', location: { lng: 20.4612, lat: 44.8186 }, address: 'Kralja Petra 16, Belgrade', rating: 4.7, hasOutdoorSeating: true },
    { id: '2', name: 'Miners Pub', type: 'pub', location: { lng: 20.4583, lat: 44.8172 }, address: 'Rige od Fere 16, Belgrade', rating: 4.5, hasOutdoorSeating: true },
    { id: '3', name: 'Aviator Coffee', type: 'cafe', location: { lng: 20.4548, lat: 44.8138 }, address: 'Bulevar Kralja Aleksandra 32, Belgrade', rating: 4.8, hasOutdoorSeating: true },
    { id: '4', name: 'Blaznavac', type: 'pub', location: { lng: 20.4632, lat: 44.8079 }, address: 'Kneginje Ljubice 18, Belgrade', rating: 4.6, hasOutdoorSeating: true },
    { id: '5', name: 'Greenet', type: 'cafe', location: { lng: 20.4656, lat: 44.8141 }, address: 'Nušićeva 3, Belgrade', rating: 4.9, hasOutdoorSeating: false }
  ];

  const cityWeather = await fetchCityWeather();
  return <HomeClient initialVenues={mockVenues} initialCityWeather={cityWeather} />;
} 