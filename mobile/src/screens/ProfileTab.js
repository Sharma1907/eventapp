import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW, API_URL, API_HEADERS } from '../theme';
import { Card, Badge, StatBox, Divider, GradientAvatar, FadeIn, IconBox } from '../components';

export default function ProfileTab({ user, tokens, onLogout, onEditProfile, onChangePassword, onOpenNotifications }) {
  const [stats, setStats] = useState({ points: 0, rank: 0 });

  const fetchStats = useCallback(async () => {
    if (!tokens?.access) return;
    try {
      const res = await fetch(`${API_URL}/leaderboard/my/`, {
        headers: { ...API_HEADERS, 'Authorization': `Bearer ${tokens.access}` },
      });
      const data = await res.json();
      setStats({
        points: data.total_points || 0,
        rank: data.rank || 0,
      });
    } catch (e) { /* silent */ }
  }, [tokens]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const MENU = [
    { title: 'Account', items: [
      { icon: 'person-outline', label: 'Edit Profile', sub: 'Update your information', onPress: onEditProfile },
      { icon: 'notifications-outline', label: 'Notifications', sub: 'View notifications', onPress: onOpenNotifications },
      { icon: 'lock-closed-outline', label: 'Change Password', sub: 'Update your password', onPress: onChangePassword },
    ]},
    { title: 'Conference', items: [
      { icon: 'bar-chart-outline', label: 'My Activity', sub: `${stats.points} points earned` },
      { icon: 'calendar-outline', label: 'My Sessions', sub: 'Bookmarked talks' },
      { icon: 'document-text-outline', label: 'Certificates', sub: 'Download certificate' },
    ]},
    { title: 'Support', items: [
      { icon: 'help-circle-outline', label: 'Help & Support', sub: 'Contact organizers' },
      { icon: 'globe-outline', label: 'Conference Site', sub: 'etd2026.iitd.ac.in' },
    ]},
  ];

  // Research interests tags
  const interests = (user.research_interests || '').split(',').map(t => t.trim()).filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0333b6', '#0448c8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={p.header}>
          <View style={p.deco} />
          <FadeIn>
            {user.profile_photo_url ? (
              <Image source={{ uri: user.profile_photo_url }} style={{ width: 84, height: 84, borderRadius: 26, borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: SPACE.md }} />
            ) : (
              <GradientAvatar name={user.first_name || user.email} size={84} radius={26} style={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: SPACE.md }} />
            )}
            <Text style={p.name}>{user.first_name} {user.last_name}</Text>
            {user.designation ? <Text style={p.designation}>{user.designation}</Text> : null}
            <Text style={p.email}>{user.email}</Text>
            <View style={p.badgeRow}>
              <Badge label={(user.role || 'participant').replace('_', ' ').toUpperCase()} color={COLORS.accent} bg={COLORS.accentMid} />
              {user.affiliation ? <><View style={p.bSep} /><Text style={p.aff}>{user.affiliation}</Text></> : null}
            </View>
          </FadeIn>
        </LinearGradient>

        <View style={{ backgroundColor: '#0448c8', height: 22 }}><View style={p.curve} /></View>

        <View style={p.body}>
          {/* Stats */}
          <FadeIn delay={100}>
            <Card style={p.statsCard} shadow="sm">
              {[
                [String(stats.points), 'Points'],
                [stats.rank > 0 ? `#${stats.rank}` : '—', 'Rank'],
                [user.profile_complete ? '✓' : '○', 'Profile'],
              ].map(([v, l], i, a) => (
                <React.Fragment key={l}>
                  <StatBox value={v} label={l} />
                  {i < a.length - 1 && <View style={p.statSep} />}
                </React.Fragment>
              ))}
            </Card>
          </FadeIn>

          {/* Research interests */}
          {interests.length > 0 && (
            <FadeIn delay={120}>
              <Card style={p.interestsCard} shadow="sm">
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACE.sm }}>
                  <Ionicons name="flask-outline" size={16} color={COLORS.brand} style={{ marginRight: SPACE.sm }} />
                  <Text style={{ fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.text }}>Research Interests</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm }}>
                  {interests.map(tag => (
                    <View key={tag} style={p.interestTag}>
                      <Text style={p.interestText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </FadeIn>
          )}

          {/* Menu sections */}
          {MENU.map((sec, si) => (
            <FadeIn key={sec.title} delay={150 + si * 60}>
              <Text style={p.secLabel}>{sec.title.toUpperCase()}</Text>
              <Card style={p.menuCard} shadow="sm">
                {sec.items.map((item, ii) => (
                  <React.Fragment key={item.label}>
                    <TouchableOpacity style={p.menuRow} activeOpacity={0.7} onPress={item.onPress || undefined}>
                      <IconBox name={item.icon} size={17} color={COLORS.brand} bg={COLORS.bgCard} boxSize={38} radius={RADIUS.md} style={{ marginRight: SPACE.md }} />
                      <View style={{ flex: 1 }}>
                        <Text style={p.menuLabel}>{item.label}</Text>
                        <Text style={p.menuSub}>{item.sub}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                    </TouchableOpacity>
                    {ii < sec.items.length - 1 && <Divider style={{ marginLeft: SPACE.md + 38 + SPACE.md }} />}
                  </React.Fragment>
                ))}
              </Card>
            </FadeIn>
          ))}

          <FadeIn delay={400}>
            <TouchableOpacity style={p.logout} onPress={onLogout} activeOpacity={0.75}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.error} style={{ marginRight: SPACE.sm }} />
              <Text style={p.logoutText}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={p.ver}>ETD 2026  ·  v1.0</Text>
            <Text style={p.ver}>IIT Delhi  ·  etd2026.iitd.ac.in</Text>
          </FadeIn>
          <View style={{ height: 110 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const p = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 46, paddingBottom: SPACE.xxxl, paddingHorizontal: SPACE.xl, alignItems: 'center', overflow: 'hidden' },
  deco: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', top: -50, right: -50 },
  name: { fontSize: FONT.xl, fontWeight: FONT.w8, color: COLORS.textInverse, textAlign: 'center' },
  designation: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.70)', marginTop: 2, textAlign: 'center' },
  email: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.55)', marginTop: 4, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE.md, justifyContent: 'center' },
  bSep: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: SPACE.md },
  aff: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.60)' },
  curve: { flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: RADIUS.xxxl, borderTopRightRadius: RADIUS.xxxl },
  body: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.lg },
  statsCard: { flexDirection: 'row', overflow: 'hidden', marginBottom: SPACE.xl },
  statSep: { width: 1, backgroundColor: COLORS.borderLight, marginVertical: SPACE.sm },
  interestsCard: { padding: SPACE.lg, marginBottom: SPACE.xl },
  interestTag: { backgroundColor: COLORS.brandLight, paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs, borderRadius: RADIUS.full },
  interestText: { fontSize: FONT.xs, fontWeight: FONT.w6, color: COLORS.brand },
  secLabel: { fontSize: FONT.xs, fontWeight: FONT.w7, color: COLORS.textTer, letterSpacing: 1, marginBottom: SPACE.sm, marginLeft: SPACE.xs },
  menuCard: { overflow: 'hidden', marginBottom: SPACE.xl },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACE.md, paddingHorizontal: SPACE.lg },
  menuLabel: { fontSize: FONT.sm, fontWeight: FONT.w6, color: COLORS.text },
  menuSub: { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.error, backgroundColor: COLORS.surface, marginBottom: SPACE.xl },
  logoutText: { fontSize: FONT.md, fontWeight: FONT.w6, color: COLORS.error },
  ver: { textAlign: 'center', fontSize: FONT.xs, color: COLORS.textTer, opacity: 0.5, marginBottom: 3 },
});
