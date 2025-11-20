/**
 * Context utilities for location and time awareness
 */

import * as Location from 'expo-location';
import { UserContext } from '@/types/feed';

export async function getLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export function getTimeOfDay(): UserContext['timeOfDay'] {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export async function getCurrentLocation() {
  try {
    const hasPermission = await getLocationPermission();
    if (!hasPermission) return null;
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    const [geocode] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      placeName: geocode?.city || geocode?.name || 'Unknown',
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

export function checkGeofence(
  currentLocation: { latitude: number; longitude: number },
  targetLocation: { latitude: number; longitude: number },
  radiusInMeters: number = 100
): boolean {
  // Haversine formula to calculate distance
  const R = 6371e3; // Earth radius in meters
  const φ1 = (currentLocation.latitude * Math.PI) / 180;
  const φ2 = (targetLocation.latitude * Math.PI) / 180;
  const Δφ = ((targetLocation.latitude - currentLocation.latitude) * Math.PI) / 180;
  const Δλ = ((targetLocation.longitude - currentLocation.longitude) * Math.PI) / 180;
  
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= radiusInMeters;
}

export async function getUserContext(): Promise<UserContext> {
  const location = await getCurrentLocation();
  const timeOfDay = getTimeOfDay();
  
  // TODO: Implement home location check from user settings
  // For now, assume away from home
  const isAtHome = false;
  
  return {
    timeOfDay,
    isAtHome,
    location: location || undefined,
  };
}
