import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCached(key) {
  try {
    const raw = await AsyncStorage.getItem(`cache_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > DEFAULT_TTL) return null; // expired
    return data;
  } catch { return null; }
}

export async function setCache(key, data) {
  try {
    await AsyncStorage.setItem(`cache_${key}`, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* silent */ }
}

export async function clearCache(key) {
  try {
    await AsyncStorage.removeItem(`cache_${key}`);
  } catch { /* silent */ }
}
