// lib/locationService.ts
// GPS Location and Weather Service for Dynamic Feed Context

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = '@location_cache';
const WEATHER_CACHE_KEY = '@weather_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  neighborhood?: string;
  timestamp: number;
}

export interface WeatherContext {
  temperature: number;
  condition:
    | 'sunny'
    | 'cloudy'
    | 'rainy'
    | 'snowy'
    | 'stormy'
    | 'foggy'
    | 'clear';
  description: string;
  humidity: number;
  feelsLike: number;
  icon: string;
  timestamp: number;
}

export interface LocationContext {
  location: UserLocation | null;
  weather: WeatherContext | null;
  isAtHome: boolean;
  isAtWork: boolean;
  isOutdoors: boolean;
  nearbyPlaces: string[];
  suggestions: string[];
}

// Get location permission status
export async function getLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error getting location permission:', error);
    return false;
  }
}

// Get current user location with geocoding
export async function getCurrentLocation(): Promise<UserLocation | null> {
  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const parsedCache = JSON.parse(cached) as UserLocation;
      if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
        console.log('📍 Using cached location:', parsedCache.city);
        return parsedCache;
      }
    }

    const hasPermission = await getLocationPermission();
    if (!hasPermission) {
      console.log('📍 Location permission denied');
      return null;
    }

    console.log('📍 Getting current location...');
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Reverse geocode to get city/country
    const geocode = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    const locationData: UserLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      city: geocode[0]?.city || geocode[0]?.subregion || undefined,
      country: geocode[0]?.country || undefined,
      neighborhood: geocode[0]?.district || geocode[0]?.street || undefined,
      timestamp: Date.now(),
    };

    // Cache the result
    await AsyncStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify(locationData)
    );
    console.log(
      '📍 Location obtained:',
      locationData.city,
      locationData.country
    );

    return locationData;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

// Get weather data for location (simulated - would use real API in production)
export async function getWeatherForLocation(
  location: UserLocation
): Promise<WeatherContext | null> {
  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
      const parsedCache = JSON.parse(cached) as WeatherContext;
      if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
        console.log('🌤️ Using cached weather');
        return parsedCache;
      }
    }

    // In production, call a real weather API
    // For now, simulate based on time of day and season
    const hour = new Date().getHours();
    const month = new Date().getMonth();

    // Simulate weather based on time and season
    let condition: WeatherContext['condition'] = 'sunny';
    let temperature = 20;
    let description = 'Clear skies';

    // Morning fog
    if (hour >= 5 && hour < 8) {
      condition = Math.random() > 0.5 ? 'foggy' : 'cloudy';
      description = condition === 'foggy' ? 'Misty morning' : 'Partly cloudy';
    }
    // Daytime
    else if (hour >= 8 && hour < 18) {
      const rand = Math.random();
      if (rand < 0.6) {
        condition = 'sunny';
        description = 'Beautiful sunny day';
      } else if (rand < 0.8) {
        condition = 'cloudy';
        description = 'Partly cloudy';
      } else {
        condition = 'rainy';
        description = 'Light showers expected';
      }
    }
    // Evening
    else if (hour >= 18 && hour < 21) {
      condition = 'clear';
      description = 'Clear evening skies';
    }
    // Night
    else {
      condition = 'clear';
      description = 'Clear night';
    }

    // Adjust temperature by season (northern hemisphere)
    if (month >= 11 || month <= 2) {
      temperature = 5 + Math.random() * 10; // Winter: 5-15°C
    } else if (month >= 3 && month <= 5) {
      temperature = 12 + Math.random() * 10; // Spring: 12-22°C
    } else if (month >= 6 && month <= 8) {
      temperature = 20 + Math.random() * 12; // Summer: 20-32°C
    } else {
      temperature = 10 + Math.random() * 10; // Autumn: 10-20°C
    }

    const weatherData: WeatherContext = {
      temperature: Math.round(temperature),
      condition,
      description,
      humidity: Math.round(40 + Math.random() * 40),
      feelsLike: Math.round(temperature + (Math.random() * 4 - 2)),
      icon: getWeatherIcon(condition, hour),
      timestamp: Date.now(),
    };

    // Cache the result
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherData));
    console.log(
      '🌤️ Weather:',
      weatherData.condition,
      weatherData.temperature + '°C'
    );

    return weatherData;
  } catch (error) {
    console.error('Error getting weather:', error);
    return null;
  }
}

// Get weather icon based on condition and time
function getWeatherIcon(
  condition: WeatherContext['condition'],
  hour: number
): string {
  const isNight = hour < 6 || hour >= 20;

  switch (condition) {
    case 'sunny':
      return isNight ? 'moon' : 'sunny';
    case 'cloudy':
      return isNight ? 'cloudy-night' : 'partly-sunny';
    case 'rainy':
      return 'rainy';
    case 'snowy':
      return 'snow';
    case 'stormy':
      return 'thunderstorm';
    case 'foggy':
      return 'cloud';
    case 'clear':
      return isNight ? 'moon' : 'sunny';
    default:
      return 'sunny';
  }
}

// Get full location context with weather and suggestions
export async function getLocationContext(): Promise<LocationContext> {
  const location = await getCurrentLocation();
  let weather: WeatherContext | null = null;

  if (location) {
    weather = await getWeatherForLocation(location);
  }

  // Generate contextual suggestions based on weather and time
  const suggestions = generateLocationSuggestions(weather);

  return {
    location,
    weather,
    isAtHome: false, // Would use geofencing in production
    isAtWork: false,
    isOutdoors: false,
    nearbyPlaces: [],
    suggestions,
  };
}

// Generate contextual suggestions based on weather
function generateLocationSuggestions(weather: WeatherContext | null): string[] {
  const suggestions: string[] = [];
  const hour = new Date().getHours();

  if (!weather) {
    return ['Start your day with intention', 'Focus on what matters most'];
  }

  // Weather-based suggestions
  if (weather.condition === 'sunny' && hour >= 7 && hour < 18) {
    suggestions.push('Perfect weather for a walk outside 🌞');
    suggestions.push('Consider a outdoor workout today');
  } else if (weather.condition === 'rainy') {
    suggestions.push('Cozy day for reading or reflection 🌧️');
    suggestions.push('Great time for indoor productivity');
  } else if (weather.condition === 'cloudy') {
    suggestions.push('Good conditions for focused work');
  }

  // Temperature-based
  if (weather.temperature > 25) {
    suggestions.push('Stay hydrated! Drink water regularly 💧');
  } else if (weather.temperature < 10) {
    suggestions.push('Bundle up if going outside 🧥');
  }

  // Time-based additions
  if (hour >= 5 && hour < 9) {
    suggestions.push('Morning is the best time for hard tasks');
  } else if (hour >= 12 && hour < 14) {
    suggestions.push('Consider a short walk after lunch');
  } else if (hour >= 14 && hour < 17) {
    suggestions.push('Afternoon slump? Try a 5-min stretch');
  } else if (hour >= 17 && hour < 21) {
    suggestions.push('Wind down with something you enjoy');
  }

  return suggestions.slice(0, 3);
}

// Format location for display
export function formatLocation(location: UserLocation | null): string {
  if (!location) return 'Location unavailable';

  const parts: string[] = [];
  if (location.neighborhood) parts.push(location.neighborhood);
  if (location.city) parts.push(location.city);

  return parts.join(', ') || 'Your location';
}

// Get location-aware greeting
export function getLocationGreeting(
  location: UserLocation | null,
  weather: WeatherContext | null
): string {
  const hour = new Date().getHours();
  let greeting = '';

  // Time-based greeting
  if (hour >= 5 && hour < 12) greeting = 'Good morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17 && hour < 21) greeting = 'Good evening';
  else greeting = 'Hello';

  // Add weather context
  if (weather) {
    if (weather.condition === 'sunny' && weather.temperature > 20) {
      greeting += ' ☀️';
    } else if (weather.condition === 'rainy') {
      greeting += ' 🌧️';
    } else if (weather.condition === 'snowy') {
      greeting += ' ❄️';
    }
  }

  // Add location context
  if (location?.city) {
    greeting += ` in ${location.city}`;
  }

  return greeting;
}

// Clear location cache (for testing)
export async function clearLocationCache(): Promise<void> {
  await AsyncStorage.multiRemove([LOCATION_CACHE_KEY, WEATHER_CACHE_KEY]);
  console.log('📍 Location cache cleared');
}
