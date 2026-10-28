import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useWeather } from '../hooks/useWeather';
import { themeFor } from '../utils/theme';

function iconForWeather(code: number, isDay: boolean) {
  if (code >= 95) return '\u26C8';
  if (code === 45 || code === 48) return '\u{1F32B}';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '\u{1F328}';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '\u{1F327}';
  if (code === 3) return '\u2601';
  if (code === 2) return isDay ? '\u{1F324}' : '\u{1F325}';
  if (code <= 1) return isDay ? '\u2600' : '\u{1F319}';
  return isDay ? '\u2601' : '\u{1F319}';
}

export default function Index() {
  const {
    data,
    error,
    locationName,
    searchResults,
    loading,
    searching,
    searchLocations,
    selectLocation,
    useCurrentLocation,
    clearError,
  } = useWeather();
  const [query, setQuery] = useState('');
  const theme = themeFor(data?.current?.weather_code ?? 0);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      void searchLocations(query);
    }, query.trim().length < 2 ? 0 : 300);

    return () => clearTimeout(timeout);
  }, [query, searchLocations]);

  const hourly = data?.hourly?.time
    ? data.hourly.time
        .map((time: string, index: number) => ({
          time,
          temperature: data.hourly.temperature_2m[index],
          code: data.hourly.weather_code[index],
          isDay: data.hourly.is_day[index] === 1,
        }))
        .filter((hour: { time: string }) => hour.time >= data.current.time)
        .slice(0, 12)
    : [];

  return (
    <LinearGradient colors={theme.colors} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.top} keyboardShouldPersistTaps="handled">
        <Text style={styles.city}>{locationName}</Text>
        <Text style={styles.date}>{today}</Text>

        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              clearError();
            }}
            onSubmitEditing={() => void searchLocations(query)}
            placeholder="Search city or place"
            placeholderTextColor="#666"
            returnKeyType="search"
            style={styles.searchInput}
            accessibilityLabel="Search for a location"
          />
        </View>
        {searching ? <Text style={styles.searching}>Searching locations…</Text> : null}
        <Pressable style={styles.currentLocationButton} onPress={() => void useCurrentLocation()}>
          <Text style={styles.currentLocationText}>Use current location</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {searchResults.length > 0 ? (
          <View style={styles.results}>
            {searchResults.map((place) => {
              const label = [place.name, place.admin1, place.country]
                .filter((part, index, all) => part && all.indexOf(part) === index)
                .join(', ');
              return (
                <Pressable
                  key={`${place.id}-${place.latitude}-${place.longitude}`}
                  onPress={() => {
                    selectLocation(place);
                    setQuery('');
                  }}
                  style={styles.result}
                >
                  <Text style={styles.resultText}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {data ? (
          <>
            <Text style={styles.temp}>{Math.round(data.current.temperature_2m)}°</Text>
            <Text style={styles.label}>{theme.label}</Text>
            <Text style={styles.sectionTitle}>Hourly forecast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyList}>
              {hourly.map((hour: { time: string; temperature: number; code: number; isDay: boolean }) => {
                const hourOfDay = Number(hour.time.slice(11, 13));
                const currentHour = Number(data.current.time.slice(11, 13));
                const timeLabel = hourOfDay === currentHour
                  ? 'Now'
                  : new Date(2000, 0, 1, hourOfDay).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

                return (
                  <View key={hour.time} style={styles.hour}>
                    <Text style={styles.hourTime}>{timeLabel}</Text>
                    <Text style={styles.hourIcon}>{iconForWeather(hour.code, hour.isDay)}</Text>
                    <Text style={styles.hourTemp}>{Math.round(hour.temperature)}°</Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        ) : <Text style={styles.loading}>{loading ? 'Loading weather…' : 'Search for a location to see its forecast.'}</Text>}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  top: { flexGrow: 1, justifyContent: 'flex-end', paddingTop: 64, paddingBottom: 24 },
  city: { fontSize: 26, color: '#111' },
  date: { fontSize: 16, color: '#111', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: '#777', paddingHorizontal: 12, color: '#111', backgroundColor: 'rgba(255,255,255,0.72)' },
  searching: { color: '#333', fontSize: 13, marginTop: 6 },
  currentLocationButton: { alignSelf: 'flex-start', paddingVertical: 10 },
  currentLocationText: { color: '#252638', fontSize: 14, textDecorationLine: 'underline' },
  error: { color: '#8a1c1c', marginBottom: 8 },
  results: { borderRadius: 10, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.88)', marginBottom: 8 },
  result: { paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#bbb' },
  resultText: { color: '#111' },
  loading: { marginTop: 12, color: '#333' },
  temp: { fontSize: 110, fontWeight: '300', color: '#000', lineHeight: 120, marginTop: 4 },
  label: { fontSize: 16, color: '#111' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111', marginTop: 28, marginBottom: 14 },
  hourlyList: { gap: 22, paddingRight: 8 },
  hour: { width: 52, alignItems: 'center', gap: 8 },
  hourTime: { fontSize: 13, color: '#333' },
  hourIcon: { fontSize: 24 },
  hourTemp: { fontSize: 16, color: '#111' },
});
