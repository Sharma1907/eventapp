import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, SPACE, RADIUS, SHADOW } from './theme';
import HomeTab from './screens/HomeTab';
import ScheduleTab from './screens/ScheduleTab';
import QRScreen from './screens/QRScreen';
import FeedScreen from './screens/FeedScreen';
import ProfileTab from './screens/ProfileTab';
import NotificationsScreen from './screens/NotificationsScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';

const TABS = [
  { key: 'home', iconOn: 'home', iconOff: 'home-outline', label: 'Home' },
  { key: 'schedule', iconOn: 'calendar', iconOff: 'calendar-outline', label: 'Schedule' },
  { key: 'qr', iconOn: 'qr-code', iconOff: 'qr-code-outline', label: 'My QR' },
  { key: 'feed', iconOn: 'newspaper', iconOff: 'newspaper-outline', label: 'Feed' },
  { key: 'profile', iconOn: 'person', iconOff: 'person-outline', label: 'Profile' },
];

function BottomTabBar({ active, onTab }) {
  const scales = useRef(TABS.map(() => new Animated.Value(1))).current;
  const press = (key, i) => {
    Animated.sequence([
      Animated.timing(scales[i], { toValue: 0.82, duration: 80, useNativeDriver: true }),
      Animated.spring(scales[i], { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    onTab(key);
  };

  return (
    <View style={s.bar}>
      {TABS.map((t, i) => {
        const on = active === t.key;
        return (
          <TouchableOpacity key={t.key} style={s.tabItem} onPress={() => press(t.key, i)} activeOpacity={1}>
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: scales[i] }] }}>
              {t.key === 'qr' ? (
                <LinearGradient colors={[COLORS.accent, COLORS.accentDark]} style={s.qrBtn}>
                  <Ionicons name="qr-code" size={24} color={COLORS.textInverse} />
                </LinearGradient>
              ) : (
                <>
                  <View style={[s.iconWrap, on && s.iconWrapOn]}>
                    <Ionicons name={on ? t.iconOn : t.iconOff} size={20} color={on ? COLORS.brand : COLORS.textTer} />
                  </View>
                  <Text style={[s.tabLabel, on && s.tabLabelOn]}>{t.label}</Text>
                </>
              )}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function MainApp({ user: initialUser, tokens, onLogout }) {
  const [tab, setTab] = useState('home');
  const [subScreen, setSubScreen] = useState(null);   // 'notifications' | 'edit_profile' | 'change_password'
  const [user, setUser] = useState(initialUser);

  const handleProfileUpdated = (updatedUser) => {
    setUser(updatedUser);
  };

  // Sub-screens (overlay on top of tabs)
  if (subScreen === 'notifications') {
    return <NotificationsScreen tokens={tokens} onBack={() => setSubScreen(null)} />;
  }

  if (subScreen === 'edit_profile') {
    return (
      <EditProfileScreen
        user={user}
        tokens={tokens}
        onBack={() => setSubScreen(null)}
        onProfileUpdated={handleProfileUpdated}
      />
    );
  }

  if (subScreen === 'change_password') {
    return (
      <ChangePasswordScreen
        user={user}
        tokens={tokens}
        onDone={() => setSubScreen(null)}
        onLogout={onLogout}
      />
    );
  }

  const SCREENS = {
    home: <HomeTab user={user} tokens={tokens} onOpenNotifications={() => setSubScreen('notifications')} />,
    schedule: <ScheduleTab />,
    qr: <QRScreen user={user} />,
    feed: <FeedScreen />,
    profile: (
      <ProfileTab
        user={user}
        tokens={tokens}
        onLogout={onLogout}
        onEditProfile={() => setSubScreen('edit_profile')}
        onChangePassword={() => setSubScreen('change_password')}
        onOpenNotifications={() => setSubScreen('notifications')}
      />
    ),
  };

  return (
    <View style={{ flex: 1 }}>
      {SCREENS[tab] || SCREENS.home}
      <BottomTabBar active={tab} onTab={setTab} />
    </View>
  );
}

const s = StyleSheet.create({
  bar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingBottom: Platform.OS === 'ios' ? 24 : SPACE.sm, paddingTop: SPACE.sm, paddingHorizontal: SPACE.sm },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  iconWrap: { width: 36, height: 28, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  iconWrapOn: { backgroundColor: COLORS.brandLight },
  tabLabel: { fontSize: 10, fontWeight: FONT.w5, color: COLORS.textTer, marginTop: 3 },
  tabLabelOn: { color: COLORS.brand, fontWeight: FONT.w7 },
  qrBtn: { width: 52, height: 52, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', marginTop: -22, ...SHADOW.accent },
});
