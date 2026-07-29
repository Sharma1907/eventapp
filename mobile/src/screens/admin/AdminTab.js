import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, SPACE, RADIUS } from '../../theme';
import { FadeIn, IconBox, Divider } from '../../components';
import NotificationsAdmin from './NotificationsAdmin';
import UsersAdmin from './UsersAdmin';

const ADMIN_FEATURES = [
  {
    key:   'notifications',
    icon:  'megaphone',
    label: 'Push Notifications',
    sub:   'Send, edit & delete notifications',
    color: COLORS.brand,
    bg:    COLORS.brandLight,
  },
  {
    key:   'users',
    icon:  'people',
    label: 'User Management',
    sub:   'Warn or suspend accounts',
    color: COLORS.purple,
    bg:    COLORS.purpleLight,
  },
  // ── future admin features go here ──────────────────────────────────────
  // ceiling: event management, scanner stats, reports/export
];

export default function AdminTab({ user, tokens }) {
  const [screen, setScreen] = useState(null);

  if (screen === 'notifications') {
    return <NotificationsAdmin tokens={tokens} onBack={() => setScreen(null)} />;
  }
  if (screen === 'users') {
    return <UsersAdmin tokens={tokens} onBack={() => setScreen(null)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* hero */}
      <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={a.hero}>
        <View style={a.blob} />
        <View style={a.shieldWrap}>
          <Ionicons name="shield-checkmark" size={36} color="#fff" />
        </View>
        <Text style={a.heroTitle}>Admin Panel</Text>
        <Text style={a.heroSub}>{user.first_name} {user.last_name}</Text>
        <View style={a.rolePill}>
          <Text style={a.roleTxt}>{(user.role || '').replace('_', ' ').toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: SPACE.xl, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={60}>
          <Text style={a.secLabel}>MANAGE</Text>
          <View style={a.card}>
            {ADMIN_FEATURES.map((feat, i) => (
              <React.Fragment key={feat.key}>
                <TouchableOpacity
                  style={a.row}
                  activeOpacity={0.7}
                  onPress={() => setScreen(feat.key)}
                >
                  <IconBox
                    name={feat.icon}
                    size={18}
                    color={feat.color}
                    bg={feat.bg}
                    boxSize={42}
                    radius={RADIUS.md}
                    style={{ marginRight: SPACE.md }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={a.rowLabel}>{feat.label}</Text>
                    <Text style={a.rowSub}>{feat.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                </TouchableOpacity>
                {i < ADMIN_FEATURES.length - 1 && (
                  <Divider style={{ marginLeft: SPACE.md + 42 + SPACE.md }} />
                )}
              </React.Fragment>
            ))}
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <Text style={a.secLabel}>QUICK LINKS</Text>
          <View style={a.card}>
            <Text style={a.hint}>
              <Ionicons name="globe-outline" size={13} color={COLORS.textTer} />
              {'  '}Full web dashboard available at your server's /panel/ URL
            </Text>
          </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

const a = StyleSheet.create({
  hero: {
    paddingTop: Platform.OS === 'ios' ? 58 : 46,
    paddingBottom: SPACE.xxl,
    paddingHorizontal: SPACE.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -50,
  },
  shieldWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACE.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: { fontSize: FONT.xl, fontWeight: FONT.w9, color: '#fff', letterSpacing: -0.3 },
  heroSub:   { fontSize: FONT.sm, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  rolePill: {
    marginTop: SPACE.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACE.md, paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  roleTxt: { fontSize: 10, fontWeight: FONT.w8, color: '#fff', letterSpacing: 0.8 },

  secLabel: {
    fontSize: 10, fontWeight: FONT.w8, color: COLORS.textTer,
    letterSpacing: 1.5, marginBottom: SPACE.sm, marginLeft: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: RADIUS.xl, padding: SPACE.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    marginBottom: SPACE.xl,
  },
  row:      { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.md },
  rowLabel: { fontSize: FONT.sm, fontWeight: FONT.w6, color: COLORS.text },
  rowSub:   { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2 },
  hint:     { fontSize: FONT.xs, color: COLORS.textTer, lineHeight: 20 },
});
