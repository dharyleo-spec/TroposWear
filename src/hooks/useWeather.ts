import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

export type WeatherLocation = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

type GeocodingResponse = { results?: WeatherLocation[] };

export function useWeather() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('Current location');
  const [searchResults, setSearchResults] = useState<WeatherLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const requestId = useRef(0);

  const loadWeather = useCallback(async (latitude: number, longitude: number, name: string) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&hourly=temperature_2m,apparent_temperature,precipitation_probability,uv_index,weather_code,wind_speed_10m,is_day` +
        `&timezone=auto&forecast_days=2`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Could not load weather for this location.');
      const forecast = await response.json();
      if (id === requestId.current) {
        setData(forecast);
        setLocationName(name);
      }
    } catch (e) {
      if (id === requestId.current) {
        setError(e instanceof Error ? e.message : 'Could not load weather.');
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const searchLocations = useCallback(async (query: string) => {
    const value = query.trim();
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=6&language=en&format=json`,
      );
      if (!response.ok) throw new Error('Location search failed. Try again.');
      const result = (await response.json()) as GeocodingResponse;
      setSearchResults(result.results ?? []);
      if (!result.results?.length) setError('No matching locations found.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Location search failed.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const selectLocation = useCallback((place: WeatherLocation) => {
    setSearchResults([]);
    const name = [place.name, place.admin1, place.country]
      .filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index)
      .join(', ');
    void loadWeather(place.latitude, place.longitude, name);
  }, [loadWeather]);

  const useCurrentLocation = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location access denied. Search for a city instead.');
      const { coords } = await Location.getCurrentPositionAsync({});
      if (id !== requestId.current) return;
      // loadWeather owns the request counter from this point forward.
      await loadWeather(coords.latitude, coords.longitude, 'Current location');
    } catch (e) {
      if (id === requestId.current) {
        setError(e instanceof Error ? e.message : 'Could not get your location.');
        setLoading(false);
      }
    }
  }, [loadWeather]);

  useEffect(() => {
    void useCurrentLocation();
  }, [useCurrentLocation]);

  return {
    data,
    error,
    locationName,
    searchResults,
    loading,
    searching,
    searchLocations,
    selectLocation,
    useCurrentLocation,
    clearError: () => setError(null),
  };
}
