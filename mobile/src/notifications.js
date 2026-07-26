import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_URL, API_HEADERS } from './theme';

// Show notification when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ─── IMPORTANT: paste your Expo project ID here ──────────────
// Get it from: https://expo.dev → your project → Project ID
const EXPO_PROJECT_ID = 'afa28d7e-10d5-4e85-bed4-783b7371a56b';
// ─────────────────────────────────────────────────────────────

export async function registerForPushNotifications(accessToken) {
  if (!Device.isDevice) {
    console.log('[Push] Skipping — simulator/emulator does not receive push');
    return null;
  }

  // Request permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission denied by user');
    return null;
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:              'ETD 2026',
      importance:        Notifications.AndroidImportance.MAX,
      vibrationPattern:  [0, 250, 250, 250],
      lightColor:        '#0333b6',
      sound:             'default',
    });
  }

  // Get Expo push token — works in Expo Go
  let token;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });
    token = tokenData.data;
    console.log('[Push] Expo token:', token);
  } catch (err) {
    console.log('[Push] Failed to get token:', err.message);
    return null;
  }

  // Register with Django backend
  try {
    const res = await fetch(`${API_URL}/notifications/register-token/`, {
      method:  'POST',
      headers: { ...API_HEADERS, 'Authorization': `Bearer ${accessToken}` },
      body:    JSON.stringify({ token, platform: Platform.OS }),
    });
    const data = await res.json();
    console.log('[Push] Backend registration:', data);
  } catch (err) {
    console.log('[Push] Backend registration failed:', err.message);
  }

  return token;
}

export async function unregisterToken(token, accessToken) {
  if (!token || !accessToken) return;
  try {
    await fetch(`${API_URL}/notifications/unregister-token/`, {
      method:  'POST',
      headers: { ...API_HEADERS, 'Authorization': `Bearer ${accessToken}` },
      body:    JSON.stringify({ token }),
    });
    console.log('[Push] Token unregistered');
  } catch (err) {
    console.log('[Push] Unregister failed:', err.message);
  }
}

export function setupNotificationListeners(onReceive, onTap) {
  const sub1 = Notifications.addNotificationReceivedListener(notification => {
    console.log('[Push] Received:', notification.request.content.title);
    onReceive && onReceive(notification);
  });

  const sub2 = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('[Push] Tapped:', response.notification.request.content.title);
    onTap && onTap(response);
  });

  // Return cleanup
  return () => { sub1.remove(); sub2.remove(); };
}
