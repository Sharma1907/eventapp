import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  StyleSheet, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW, W, API_URL, API_HEADERS } from '../theme';
import {
  Card, GlassCard, Badge, StatBox, SectionHeader,
  IconBox, FadeIn, PulsingDot, GradientAvatar,
} from '../components';

const CW = (W - SPACE.xl * 2 - SPACE.md * 2) / 3;

const ACTIONS = [
  { icon: 'calendar-outline', title: 'Schedule', sub: 'Sessions', color: COLORS.brand, bg: COLORS.brandLight },
  { icon: 'camera-outline', title: 'Photos', sub: 'Gallery', color: COLORS.success, bg: COLORS.successLight },
  { icon: 'stats-chart-outline', title: 'Polls', sub: 'Vote now', color: COLORS.accent, bg: COLORS.accentLight },
  { icon: 'newspaper-outline', title: 'Feed', sub: 'Posts', color: COLORS.purple, bg: COLORS.purpleLight },
  { icon: 'people-outline', title: 'Directory', sub: 'Attendees', color: COLORS.teal, bg: COLORS.tealLight },
  { icon: 'trophy-outline', title: 'Leaderboard', sub: 'Rankings', color: COLORS.rose, bg: COLORS.roseLight },
];

const SCHED = [
  { time: '09:00', title: 'Opening Ceremony', room: 'Hall A', speaker: 'Dr. Amit Singh', live: true },
  { time: '10:30', title: 'Keynote: AI in Research', room: 'Hall A', speaker: 'Prof. R. Johnson', live: false },
  { time: '13:00', title: 'Lunch Break', room: 'Cafeteria', speaker: '', live: false },
  { time: '14:30', title: 'Workshop: Data Science', room: 'Room 201', speaker: 'Dr. S. Williams', live: false },
];

export default function HomeTab({ user, tokens, onOpenNotifications }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [myPoints, setMyPoints] = useState(0);
  const [myRank, setMyRank] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Conference: 3 days. Set START to the first day of ETD 2026.
  // Update this date when the actual conference dates are confirmed.
  const CONF_START = new Date('2026-10-01T00:00:00');   // ← change this date
  const dayDiff = Math.floor((Date.now() - CONF_START.getTime()) / 86400000) + 1;
  const confDay = Math.min(Math.max(dayDiff, 1), 3);   // clamps to 1–3

  const hY = useRef(new Animated.Value(-20)).current;
  const hO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(hY, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(hO, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  // Fetch unread count
  const fetchUnread = useCallback(async () => {
    if (!tokens?.access) return;
    try {
      const res = await fetch(`${API_URL}/notifications/unread-count/`, {
        headers: { ...API_HEADERS, 'Authorization': `Bearer ${tokens.access}` },
      });
      const data = await res.json();
      setUnreadCount(data.unread_count || 0);
    } catch (e) {
      console.log('Unread fetch failed');
    }
  }, [tokens]);

  const fetchPoints = useCallback(async () => {
    if (!tokens?.access) return;
    try {
      const res = await fetch(`${API_URL}/leaderboard/my/`, {
        headers: { ...API_HEADERS, 'Authorization': `Bearer ${tokens.access}` },
      });
      const data = await res.json();
      setMyPoints(data.total_points || 0);
      setMyRank(data.rank || 0);
    } catch (e) {
      console.log('Points fetch failed');
    }
  }, [tokens]);

  useEffect(() => {
    fetchUnread();
    fetchPoints();
    const interval = setInterval(() => { fetchUnread(); fetchPoints(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread, fetchPoints]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#0333b6', '#0448c8']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={h.header}>
        <View style={h.arc1} />
        <View style={h.arc2} />
        <View style={h.accentBar} />

        <Animated.View style={{ transform: [{ translateY: hY }], opacity: hO }}>
          <View style={h.row}>
            <View style={{ flex: 1 }}>
              <Text style={h.greeting}>{greeting}</Text>
              <Text style={h.name}>{user.first_name || 'Attendee'}</Text>
              <View style={h.pill}>
                <PulsingDot color={COLORS.success} size={7} />
                <Text style={h.pillText}>ETD 2026  ·  IIT Delhi</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.sm }}>
              {/* Notification Bell */}
              <TouchableOpacity onPress={onOpenNotifications} style={h.bellBtn}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.textInverse} />
                {unreadCount > 0 && (
                  <View style={h.bellBadge}>
                    <Text style={h.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Avatar */}
              {user.profile_photo_url ? (
                <Image source={{ uri: user.profile_photo_url }} style={{ width: 48, height: 48, borderRadius: 15, borderWidth: 2, borderColor: COLORS.glassBorder }} />
              ) : (
                <GradientAvatar name={user.first_name || user.email} size={48} radius={15} style={{ borderWidth: 2, borderColor: COLORS.glassBorder }} />
              )}
            </View>
          </View>

          <GlassCard style={h.statsRow}>
            {[
              [`Day ${confDay}`, 'of 3'],
              [`${myPoints}`, 'Points'],
              [myRank > 0 ? `#${myRank}` : '—', 'Rank'],
            ].map(([v, l], i) => (
              <React.Fragment key={l}>
                <StatBox value={v} label={l} light />
                {i < 2 && <View style={h.statSep} />}
              </React.Fragment>
            ))}
          </GlassCard>
        </Animated.View>
      </LinearGradient>

      <View style={{ backgroundColor: '#0448c8', height: 26 }}><View style={h.curve} /></View>

      <View style={h.body}>
        <FadeIn delay={100}>
          <LinearGradient colors={[COLORS.success, '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={h.live}>
            <View style={{ flex: 1 }}>
              <View style={h.liveRow}><PulsingDot color={COLORS.textInverse} size={7} /><Text style={h.liveLabel}>LIVE NOW</Text></View>
              <Text style={h.liveTitle}>Opening Ceremony</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" style={{ marginRight: 3 }} />
                <Text style={h.liveSub}>Hall A  ·  Dr. Amit Singh</Text>
              </View>
            </View>
            <TouchableOpacity style={h.joinBtn} activeOpacity={0.8}>
              <Text style={h.joinText}>Join</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.success} />
            </TouchableOpacity>
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={180}>
          <SectionHeader title="Quick Actions" style={{ marginTop: SPACE.md }} />
          <View style={h.grid}>
            {ACTIONS.map((a, i) => (
              <FadeIn key={a.title} delay={200 + i * 40}>
                <TouchableOpacity style={[h.actionCard, { width: CW }]} activeOpacity={0.75}>
                  <IconBox name={a.icon} size={22} color={a.color} bg={a.bg} boxSize={46} radius={RADIUS.md} />
                  <Text style={h.actionTitle}>{a.title}</Text>
                  <Text style={h.actionSub}>{a.sub}</Text>
                </TouchableOpacity>
              </FadeIn>
            ))}
          </View>
        </FadeIn>

        <FadeIn delay={320}>
          <TouchableOpacity activeOpacity={0.82} style={{ marginBottom: SPACE.xl }}>
            <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={h.qrBanner}>
              <View style={h.qrDeco} />
              <View style={{ flex: 1 }}>
                <Badge label="QUICK ACCESS" color={COLORS.accent} bg={COLORS.accentMid} style={{ marginBottom: SPACE.sm }} />
                <Text style={h.qrTitle}>My Conference QR</Text>
                <Text style={h.qrSub}>Show at check-in & meal entry</Text>
              </View>
              <View style={h.qrIcon}><Ionicons name="qr-code" size={30} color={COLORS.brand} /></View>
            </LinearGradient>
          </TouchableOpacity>
        </FadeIn>

        <FadeIn delay={380}>
          <SectionHeader title="Today's Schedule" action="View All" />
          {SCHED.map((s, i) => (
            <FadeIn key={i} delay={400 + i * 50}>
              <Card style={h.schedCard} shadow="sm">
                <View style={h.schedTimeCol}>
                  <Text style={h.schedTime}>{s.time}</Text>
                  {s.live && <PulsingDot color={COLORS.success} size={7} />}
                </View>
                <View style={h.schedSep} />
                <View style={{ flex: 1 }}>
                  <View style={h.schedTitleRow}>
                    <Text style={h.schedTitle} numberOfLines={1}>{s.title}</Text>
                    {s.live && <Badge label="LIVE" color={COLORS.error} bg={COLORS.errorLight} />}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <Ionicons name="location-outline" size={11} color={COLORS.textTer} style={{ marginRight: 3 }} />
                    <Text style={h.schedSub}>{s.room}{s.speaker ? `  ·  ${s.speaker}` : ''}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.border} style={{ marginLeft: SPACE.sm }} />
              </Card>
            </FadeIn>
          ))}
        </FadeIn>
        <View style={{ height: 110 }} />
      </View>
    </ScrollView>
  );
}

const h = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 46, paddingBottom: 26, paddingHorizontal: SPACE.xl, overflow: 'hidden' },
  arc1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', top: -80, right: -60 },
  arc2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', top: 10, right: -10 },
  accentBar: { position: 'absolute', width: 4, height: 60, backgroundColor: COLORS.accent, borderRadius: 2, top: 60, left: 0 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACE.lg },
  greeting: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.58)', fontWeight: FONT.w5 },
  name: { fontSize: FONT.xxl, fontWeight: FONT.w8, color: COLORS.textInverse, marginTop: 2, letterSpacing: -0.3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, backgroundColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginTop: SPACE.sm },
  pillText: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.85)', fontWeight: FONT.w6 },
  bellBtn: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#0333b6' },
  bellBadgeText: { fontSize: 10, fontWeight: FONT.w8, color: COLORS.textInverse },
  statsRow: { flexDirection: 'row', paddingVertical: SPACE.xs, marginTop: SPACE.xs },
  statSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginVertical: SPACE.sm },
  curve: { flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: RADIUS.xxxl, borderTopRightRadius: RADIUS.xxxl },
  body: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.lg },
  live: { borderRadius: RADIUS.xl, padding: SPACE.lg, flexDirection: 'row', alignItems: 'center', marginBottom: SPACE.xl, overflow: 'hidden' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, marginBottom: SPACE.sm },
  liveLabel: { fontSize: FONT.xs, fontWeight: FONT.w8, color: COLORS.textInverse, letterSpacing: 1 },
  liveTitle: { fontSize: FONT.md, fontWeight: FONT.w7, color: COLORS.textInverse },
  liveSub: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.70)' },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.textInverse, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, borderRadius: RADIUS.md },
  joinText: { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.success },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: SPACE.md },
  actionCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACE.md, alignItems: 'center', marginBottom: SPACE.md, ...SHADOW.sm, borderWidth: Platform.OS === 'android' ? 1 : 0, borderColor: COLORS.borderLight },
  actionTitle: { fontSize: FONT.xs, fontWeight: FONT.w7, color: COLORS.text, textAlign: 'center', marginTop: SPACE.sm },
  actionSub: { fontSize: 10, color: COLORS.textTer, marginTop: 2, textAlign: 'center' },
  qrBanner: { borderRadius: RADIUS.xl, padding: SPACE.lg, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...SHADOW.brand },
  qrDeco: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', right: 20, top: -30 },
  qrTitle: { fontSize: FONT.md, fontWeight: FONT.w7, color: COLORS.textInverse },
  qrSub: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  qrIcon: { width: 56, height: 56, borderRadius: RADIUS.lg, backgroundColor: COLORS.textInverse, alignItems: 'center', justifyContent: 'center' },
  schedCard: { padding: SPACE.md, marginBottom: SPACE.sm, flexDirection: 'row', alignItems: 'center' },
  schedTimeCol: { width: 50, alignItems: 'center', gap: SPACE.xs },
  schedTime: { fontSize: FONT.xs, fontWeight: FONT.w7, color: COLORS.textSec },
  schedSep: { width: 1, height: 44, backgroundColor: COLORS.borderLight, marginHorizontal: SPACE.md },
  schedTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  schedTitle: { fontSize: FONT.sm, fontWeight: FONT.w6, color: COLORS.text, flex: 1, marginRight: SPACE.sm },
  schedSub: { fontSize: FONT.xs, color: COLORS.textTer },
});
