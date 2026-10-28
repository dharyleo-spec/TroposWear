export type Theme = {
  colors: readonly [string, string];
  label: string;
};

export function themeFor(code: number): Theme {
  if (code >= 95) {
    return { colors: ['#2b3440', '#c5c7d0'], label: 'Heavy rain and thunder' };
  }
  if (code >= 51) {
    return { colors: ['#8fb4d0', '#f3f3f3'], label: 'Light shower' };
  }
  if (code >= 2) {
    return { colors: ['#b8bfc7', '#f3f3f3'], label: 'Cloudy' };
  }
  return { colors: ['#ff9f2e', '#f3f3f3'], label: 'Clear and sunny' };
}