import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, SPACE, RADIUS, SHADOW } from './theme';
import HomeTab from './screens/HomeTab';
import ScheduleTab from './screens/ScheduleTab';
import QRScreen from './screens/QRScreen';
import FeedScreen from './screens/FeedScreen';
import NetworkScreen from './screens/NetworkScreen';
import ProfileTab from './screens/ProfileTab';
import NotificationsScreen from './screens/NotificationsScreen';
import AdminTab from './screens/admin/AdminTab';
import EditProfileScreen from './screens/EditProfileScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import SponsorsScreen from './screens/SponsorsScreen';
import SpokersScreen from './screens/SpokersScreen';

const BASE_TABS = [
  { key: 'home',     iconOn: 'home',     iconOff: 'home-outline',     label: 'Home' },
  { key: 'schedule', iconOn: 'calendar', iconOff: 'calendar-outline', label: 'Schedule' },
  { key: 'qr',       iconOn: 'qr-code',  iconOff: 'qr-code-outline', label: 'My QR' },
  { key: 'network',  iconOn: 'people',   iconOff: 'people-outline',   label: 'Network' },
  { key: 'profile',  iconOn: 'person',   iconOff: 'person-outline',   label: 'Profile' },
];
const ADMIN_TAB = { key: 'admin', iconOn: 'shield-checkmark', iconOff: 'shield-checkmark-outline', label: 'Admin' };

function getTabs(role) {
  const isAdmin = role === 'super_admin' || role === 'mgmt_admin';
  if (!isAdmin) return BASE_TABS;
  return BASE_TABS.slice(0, 4).concat(ADMIN_TAB);
}

function BottomTabBar({ active, onTab, tabs }) {
  const scales = useRef(tabs.map(() => new Animated.Value(1))).current;
  const press = (key, i) => {
    Animated.sequence([
      Animated.timing(scales[i], { toValue: 0.82, duration: 80, useNativeDriver: true }),
      Animated.spring(scales[i], { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    onTab(key);
  };

  return (
    <View style={st.bar}>
      {tabs.map((t, i) => {
        const on = active === t.key;
        return (
          <TouchableOpacity key={t.key} style={st.tabItem} onPress={() => press(t.key, i)} activeOpacity={1}>
            <Animated.View style={{ alignItems: 'center', transform: [{ scale: scales[i] }] }}>
              {t.key === 'qr' ? (
                <LinearGradient colors={[COLORS.accent, COLORS.accentDark]} style={st.qrBtn}>
                  <Ionicons name="qr-code" size={24} color={COLORS.textInverse} />
                </LinearGradient>
              ) : (
                <>
                  <View style={[st.iconWrap, on && st.iconWrapOn]}>
                    <Ionicons name={on ? t.iconOn : t.iconOff} size={20} color={on ? COLORS.brand : COLORS.textTer} />
                  </View>
                  <Text style={[st.tabLabel, on && st.tabLabelOn]}>{t.label}</Text>
                </>
              )}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function MainApp({ user: initialUser, tokens, onLogout, setUser: setUserProp, refreshUser }) {
  const [tab, setTab] = useState('home');
  const [subScreen, setSubScreen] = useState(null);
  const [user, setUser] = useState(initialUser);
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningText, setWarningText] = useState('');
  const tabs = getTabs(user.role);

  React.useEffect(() => {
    if (refreshUser) refreshUser(tokens);
  }, []);

  React.useEffect(() => {
    if (user.warning_note) {
      setWarningText(user.warning_note);
      setWarningVisible(true);
    }
  }, [user.warning_note]);

  const dismissWarning = () => setWarningVisible(false);

  const handleProfileUpdated = (updatedUser) => { setUser(updatedUser); if (setUserProp) setUserProp(updatedUser); };

  if (subScreen === 'notifications') {
    return <NotificationsScreen tokens={tokens} onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === 'edit_profile') {
    return (
      <EditProfileScreen
        user={user} tokens={tokens}
        onBack={() => setSubScreen(null)}
        onProfileUpdated={handleProfileUpdated}
      />
    );
  }
  if (subScreen === 'change_password') {
    return (
      <ChangePasswordScreen
        user={user} tokens={tokens}
        onDone={() => setSubScreen(null)}
        onLogout={onLogout}
      />
    );
  }
  if (subScreen === 'sponsors') {
    return <SponsorsScreen tokens={tokens} onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === 'speakers') {
    return <SpokersScreen tokens={tokens} onBack={() => setSubScreen(null)} />;
  }

  const SCREENS = {
    home:     <HomeTab user={user} tokens={tokens}
                onOpenNotifications={() => setSubScreen('notifications')}
                onOpenSponsors={() => setSubScreen('sponsors')}
                onOpenSpeakers={() => setSubScreen('speakers')} />,
    schedule: <ScheduleTab />,
    qr:       <QRScreen user={user} tokens={tokens} />,
    network:  <NetworkScreen tokens={tokens} />,
    profile:  (
      <ProfileTab
        user={user} tokens={tokens} onLogout={onLogout}
        onEditProfile={() => setSubScreen('edit_profile')}
        onChangePassword={() => setSubScreen('change_password')}
        onOpenNotifications={() => setSubScreen('notifications')}
      />
    ),
    admin: <AdminTab user={user} tokens={tokens} />,
  };

  return (
    <View style={{ flex: 1 }}>
      {SCREENS[tab] || SCREENS.home}
      <Modal visible={warningVisible} transparent animationType="fade" onRequestClose={dismissWarning}>
        <View style={wm.overlay}>
          <View style={wm.card}>
            <View style={wm.iconWrap}>
              <Ionicons name="warning" size={32} color="#f59e0b" />
            </View>
            <Text style={wm.title}>Warning from Admin</Text>
            <Text style={wm.body}>{warningText}</Text>
            <Text style={wm.hint}>Please review your conduct at the conference.</Text>
            <TouchableOpacity style={wm.btn} onPress={dismissWarning} activeOpacity={0.8}>
              <Text style={wm.btnTxt}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <BottomTabBar active={tab} onTab={setTab} tabs={tabs} />
    </View>
  );
}

const wm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center' },
  iconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 15, color: '#475569', lineHeight: 22, textAlign: 'center', marginBottom: 12 },
  hint: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const st = StyleSheet.create({
  bar:        { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingBottom: Platform.OS === 'ios' ? 24 : SPACE.sm, paddingTop: SPACE.sm, paddingHorizontal: SPACE.sm },
  tabItem:    { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  iconWrap:   { width: 36, height: 28, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  iconWrapOn: { backgroundColor: COLORS.brandLight },
  tabLabel:   { fontSize: 10, fontWeight: FONT.w5, color: COLORS.textTer, marginTop: 3 },
  tabLabelOn: { color: COLORS.brand, fontWeight: FONT.w7 },
  qrBtn:      { width: 52, height: 52, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', marginTop: -22, ...SHADOW.accent },
});
