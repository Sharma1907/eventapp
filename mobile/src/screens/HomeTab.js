import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  StyleSheet, Platform, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW, API_URL, API_HEADERS } from '../theme';
import { PulsingDot, GradientAvatar } from '../components';

const { width: W } = Dimensions.get('window');
const PAD = SPACE.xl;

const QUICK = [
  { icon: 'calendar-outline',    label: 'Schedule',    color: COLORS.brand,   bg: COLORS.brandLight   },
  { icon: 'camera-outline',      label: 'Photos',      color: COLORS.success, bg: COLORS.successLight },
  { icon: 'stats-chart-outline', label: 'Polls',       color: COLORS.accent,  bg: COLORS.accentLight  },
  { icon: 'newspaper-outline',   label: 'Feed',        color: COLORS.purple,  bg: COLORS.purpleLight  },
  { icon: 'people-outline',      label: 'Directory',   color: COLORS.teal,    bg: COLORS.tealLight    },
  { icon: 'trophy-outline',      label: 'Leaderboard', color: COLORS.rose,    bg: COLORS.roseLight    },
];

const TYPE_STYLE = {
  ceremony: { icon: 'star-outline',     color: COLORS.brand   },
  keynote:  { icon: 'mic-outline',       color: COLORS.purple  },
  workshop: { icon: 'construct-outline', color: COLORS.accent  },
  paper:    { icon: 'document-outline',  color: COLORS.teal    },
  poster:   { icon: 'images-outline',    color: COLORS.rose    },
  break:    { icon: 'cafe-outline',      color: COLORS.success },
  other:    { icon: 'ellipse-outline',   color: COLORS.textSec },
};

const DEFAULT_CONF = {
  name: 'ETD 2026', tagline: 'IIT Delhi', logo_url: null,
  start_date: '2026-10-23', end_date: '2026-10-25',
};

function confDay(start) {
  if (!start) return 1;
  return Math.max(1, Math.floor((Date.now() - new Date(start).getTime()) / 86400000) + 1);
}
function totalDays(start, end) {
  if (!start || !end) return 3;
  return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
}

// figure out which event is "current" based on real time
function classifyEvents(events) {
  const now = new Date();
  const hhmm = now.getHours() * 60 + now.getMinutes();
  return events.map(e => {
    const [sh, sm] = (e.start_time || '00:00').split(':').map(Number);
    const [eh, em] = (e.end_time || '23:59').split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    let status = 'next';
    if (hhmm >= start && hhmm < end) status = 'current';
    else if (hhmm >= end) status = 'past';
    return { ...e, status, startMin: start };
  }).sort((a, b) => a.startMin - b.startMin);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HomeTab({ user, tokens, onOpenNotifications }) {
  const [unread, setUnread] = useState(0);
  const [points, setPoints] = useState(0);
  const [rank, setRank] = useState(0);
  const [conf, setConf] = useState(DEFAULT_CONF);
  const [events, setEvents] = useState([]);
  const [latestNotif, setLatestNotif] = useState(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  const fetchAll = useCallback(async () => {
    if (!tokens?.access) return;
    const auth = { ...API_HEADERS, Authorization: `Bearer ${tokens.access}` };
    const safe = async (url, h) => { try { return await (await fetch(url, { headers: h })).json(); } catch { return null; } };
    const [u, p, c, ev, notif] = await Promise.all([
      safe(`${API_URL}/notifications/unread-count/`, auth),
      safe(`${API_URL}/leaderboard/my/`, auth),
      safe(`${API_URL}/conferences/settings/`, API_HEADERS),
      safe(`${API_URL}/events/today/`, API_HEADERS),
      safe(`${API_URL}/notifications/my/`, auth),
    ]);
    if (u) setUnread(u.unread_count || 0);
    if (p) { setPoints(p.total_points || 0); setRank(p.rank || 0); }
    if (c) setConf(prev => ({ ...prev, ...c }));
    if (ev?.events) setEvents(ev.events);
    if (notif?.notifications?.length) setLatestNotif(notif.notifications[0]);
  }, [tokens]);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 30000); return () => clearInterval(t); }, [fetchAll]);

  const day = confDay(conf.start_date);
  const total = totalDays(conf.start_date, conf.end_date);
  const progress = Math.min(Math.round(((day - 1) / Math.max(total - 1, 1)) * 100), 100);
  const classified = classifyEvents(events);
  const liveSession = classified.find(e => e.status === 'current');

  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f9' }}>
      <StatusBar barStyle="dark-content" />

      {/* floating top bar */}
      <View style={g.topbar}>
        <Text style={g.topbarBrand}>{conf.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.md }}>
          <TouchableOpacity onPress={onOpenNotifications} style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={26} color={COLORS.text} />
            {unread > 0 && (
              <View style={g.notifBadge}>
                <Text style={g.notifBadgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
          {user.profile_photo_url
            ? <Image source={{ uri: user.profile_photo_url }} style={g.avatar} />
            : <GradientAvatar name={user.first_name || user.email} size={40} radius={20} />}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 105, paddingBottom: 120 }}>

        {/* 1. HERO CARD */}
        <View style={{ paddingHorizontal: PAD, marginBottom: SPACE.lg }}>
          <View style={g.heroCard}>
            <View style={g.blob1} />
            <View style={g.blob2} />
            <View style={g.heroTop}>
              <View>
                <Text style={g.heroLabel}>CURRENT STATUS</Text>
                <View style={g.heroDayPill}>
                  <View style={g.heroDayDot} />
                  <Text style={g.heroDayText}>Day {day} of {total}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={g.heroLabel}>VENUE</Text>
                <Text style={g.heroVenue} numberOfLines={1}>{conf.tagline}</Text>
              </View>
            </View>
            <Text style={g.heroGreeting}>Good {greeting},{'\n'}{user.first_name || 'Attendee'} 👋</Text>
            <View style={{ marginTop: SPACE.lg }}>
              <View style={g.progressRow}>
                <Text style={g.progressLbl}>Conference Progress</Text>
                <Text style={g.progressPct}>{progress}%</Text>
              </View>
              <View style={g.progressTrack}>
                <View style={[g.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* 2. LIVE SESSION */}
        {liveSession && (
          <View style={[g.glassCard, { marginHorizontal: PAD, marginBottom: SPACE.lg }]}>
            <View style={g.liveTopRow}>
              <View style={g.livePill}>
                <PulsingDot color={COLORS.error} size={7} />
                <Text style={g.livePillText}>LIVE NOW</Text>
              </View>
              <Text style={g.liveRoom}>{(liveSession.room || '').toUpperCase()}</Text>
            </View>
            <Text style={g.liveTitle}>{liveSession.title}</Text>
            {!!liveSession.speaker && <Text style={g.liveSpeaker}>{liveSession.speaker}</Text>}
            <TouchableOpacity style={{ borderRadius: 20, overflow: 'hidden', marginTop: SPACE.md }} activeOpacity={0.82}>
              <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.md, paddingVertical: SPACE.lg, borderRadius: 20 }}>
                <Text style={{ fontSize: FONT.md, fontWeight: FONT.w7, color: '#fff' }}>Join Stream</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. QUICK ACTIONS — horizontal */}
        <Text style={[g.sectionTitle, { paddingHorizontal: PAD }]}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: PAD, gap: SPACE.md, paddingBottom: SPACE.xs }}
          style={{ marginBottom: SPACE.xl }}>
          {QUICK.map(q => (
            <TouchableOpacity key={q.label} style={g.quickCard} activeOpacity={0.75}>
              <View style={[g.quickIcon, { backgroundColor: q.bg }]}>
                <Ionicons name={q.icon} size={22} color={q.color} />
              </View>
              <Text style={g.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 4. SHOW MY QR */}
        <View style={{ paddingHorizontal: PAD, marginBottom: SPACE.xl }}>
          <TouchableOpacity activeOpacity={0.85}>
            <LinearGradient colors={[COLORS.text, '#2d3748']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={g.qrBtn}>
              <Ionicons name="qr-code" size={26} color="#fff" style={{ marginRight: SPACE.md }} />
              <Text style={g.qrBtnText}>Show My QR</Text>
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 5. MY STATUS */}
        <Text style={[g.sectionTitle, { paddingHorizontal: PAD }]}>My Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: PAD, gap: SPACE.md, paddingBottom: SPACE.xs }}
          style={{ marginBottom: SPACE.xl }}>
          {[
            { label: 'RANK',    value: rank > 0 ? `#${rank}` : '—' },
            { label: 'POINTS',  value: points >= 1000 ? `${(points/1000).toFixed(1)}k` : String(points) },
            { label: 'DAY',     value: `${day}/${total}` },
            { label: 'PROFILE', value: user.profile_complete ? '✓ Done' : 'Pending' },
          ].map(s => (
            <View key={s.label} style={g.statusPill}>
              <Text style={g.statusPillLabel}>{s.label}</Text>
              <Text style={g.statusPillValue}>{s.value}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 6. TIMELINE */}
        <View style={[g.sectionRow, { paddingHorizontal: PAD }]}>
          <Text style={g.sectionTitle}>Timeline</Text>
          <TouchableOpacity><Text style={g.sectionAction}>See Full</Text></TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: PAD, gap: SPACE.md, marginBottom: SPACE.xl }}>
          {classified.length === 0 && (
            <View style={[g.glassCard, { alignItems: 'center', paddingVertical: SPACE.xxl }]}>
              <Ionicons name="calendar-outline" size={32} color={COLORS.textTer} />
              <Text style={{ fontSize: FONT.sm, color: COLORS.textTer, marginTop: SPACE.sm }}>No events scheduled for today</Text>
            </View>
          )}
          {classified.map((ev, i) => {
            const ts = TYPE_STYLE[ev.event_type] || TYPE_STYLE.other;
            const time = (ev.start_time || '').slice(0, 5);

            if (ev.status === 'current') {
              return (
                <View key={ev.id || i} style={g.timelineCurrent}>
                  <View style={g.blob1} />
                  <View style={g.timelineCurrentTop}>
                    <Text style={g.timelineCurrentTime}>{time}</Text>
                    <View style={g.nowPill}><Text style={g.nowPillText}>NOW</Text></View>
                    <View style={[g.roomPill, { borderColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={[g.roomPillText, { color: 'rgba(255,255,255,0.7)' }]}>{ev.room}</Text>
                    </View>
                  </View>
                  <Text style={g.timelineCurrentTitle}>{ev.title}</Text>
                  {!!ev.speaker && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginTop: SPACE.sm }}>
                      <View style={g.speakerDot}><Ionicons name="person" size={12} color="rgba(255,255,255,0.7)" /></View>
                      <Text style={{ fontSize: FONT.sm, color: 'rgba(255,255,255,0.7)' }}>{ev.speaker}</Text>
                    </View>
                  )}
                </View>
              );
            }

            return (
              <View key={ev.id || i} style={[g.glassCard, ev.status === 'past' && { opacity: 0.5 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACE.xs }}>
                  <Text style={g.timelineStatus}>{ev.status === 'past' ? 'PAST' : 'NEXT'}</Text>
                  <View style={g.roomPill}><Text style={g.roomPillText}>{ev.room}</Text></View>
                </View>
                <Text style={g.timelineOtherTime}>{time}</Text>
                <Text style={g.timelineOtherTitle}>{ev.title}</Text>
                {!!ev.speaker && <Text style={{ fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2 }}>{ev.speaker}</Text>}
              </View>
            );
          })}
        </View>

        {/* 7. LATEST NOTIFICATION */}
        {latestNotif && (
          <View style={{ paddingHorizontal: PAD, marginBottom: SPACE.xl }}>
            <View style={[g.sectionRow, { marginBottom: 0 }]}>
              <Text style={g.sectionTitle}>Latest</Text>
            </View>
            <TouchableOpacity style={g.annCard} activeOpacity={0.85} onPress={onOpenNotifications}>
              <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} style={g.annTop}>
                <Ionicons name="megaphone" size={44} color="rgba(255,255,255,0.12)" />
              </LinearGradient>
              <View style={g.annBottom}>
                <Text style={g.annTime}>{timeAgo(latestNotif.delivered_at || latestNotif.created_at)}</Text>
                <Text style={g.annTitle} numberOfLines={2}>{latestNotif.title}</Text>
                <Text style={g.annBody} numberOfLines={3}>{latestNotif.body}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const g = StyleSheet.create({
  topbar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: SPACE.md, paddingHorizontal: PAD,
    backgroundColor: 'rgba(240,244,249,0.92)',
  },
  topbarBrand: { fontSize: FONT.xxl, fontWeight: FONT.w8, color: COLORS.brand, letterSpacing: -0.3 },
  notifBadge: {
    position: 'absolute', top: -3, right: -3,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 2, borderColor: '#f0f4f9',
  },
  notifBadgeText: { fontSize: 9, fontWeight: FONT.w8, color: '#fff' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: COLORS.border },

  heroCard: {
    backgroundColor: COLORS.brand, borderRadius: 32, padding: SPACE.xxl, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: COLORS.brand, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24 },
      android: { elevation: 8 },
    }),
  },
  blob1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.06)', top: -80, right: -60 },
  blob2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(245,158,11,0.08)', bottom: -40, left: -40 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACE.xl },
  heroLabel: { fontSize: 9, fontWeight: FONT.w8, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, marginBottom: SPACE.xs },
  heroDayPill: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.sm,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs, borderRadius: RADIUS.full,
  },
  heroDayDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fde68a' },
  heroDayText: { fontSize: FONT.xs, fontWeight: FONT.w6, color: '#fff' },
  heroVenue: { fontSize: FONT.sm, fontWeight: FONT.w6, color: 'rgba(255,255,255,0.85)' },
  heroGreeting: { fontSize: 34, fontWeight: FONT.w9, color: '#fff', lineHeight: 40, letterSpacing: -0.5 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACE.sm },
  progressLbl: { fontSize: 10, fontWeight: FONT.w6, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 },
  progressPct: { fontSize: 10, fontWeight: FONT.w8, color: 'rgba(255,255,255,0.7)' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#fff' },

  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 28, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)', padding: SPACE.xl,
    ...Platform.select({
      ios: { shadowColor: '#002182', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 0 },
    }),
  },

  liveTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE.md },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.sm,
    backgroundColor: COLORS.error, paddingHorizontal: SPACE.md, paddingVertical: 6, borderRadius: RADIUS.full,
  },
  livePillText: { fontSize: 10, fontWeight: FONT.w8, color: '#fff', letterSpacing: 1 },
  liveRoom: { fontSize: FONT.xs, fontWeight: FONT.w7, color: COLORS.textTer, letterSpacing: 1 },
  liveTitle: { fontSize: FONT.xl + 2, fontWeight: FONT.w9, color: COLORS.brand, letterSpacing: -0.3, marginBottom: SPACE.xs },
  liveSpeaker: { fontSize: FONT.base, color: COLORS.textSec },

  sectionTitle: { fontSize: 28, fontWeight: FONT.w9, color: COLORS.brand, letterSpacing: -0.5, marginBottom: SPACE.md },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionAction: { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.textSec, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: SPACE.md },

  quickCard: {
    borderRadius: 24, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.lg,
    alignItems: 'flex-start', gap: SPACE.md, minWidth: 100,
    backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  quickIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: FONT.sm, fontWeight: FONT.w6, color: COLORS.text },

  qrBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACE.xl, paddingVertical: SPACE.lg + 2, borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: COLORS.text, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  qrBtnText: { fontSize: FONT.md, fontWeight: FONT.w8, color: '#fff', letterSpacing: 0.3 },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.md,
    backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md, borderRadius: RADIUS.full,
  },
  statusPillLabel: { fontSize: 10, fontWeight: FONT.w8, color: COLORS.textTer, letterSpacing: 1.5 },
  statusPillValue: { fontSize: FONT.xl, fontWeight: FONT.w9, color: COLORS.text },

  timelineCurrent: {
    backgroundColor: COLORS.brand, borderRadius: 32, padding: SPACE.xxl, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: COLORS.brand, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 6 },
    }),
  },
  timelineCurrentTop: { flexDirection: 'row', alignItems: 'baseline', gap: SPACE.md, marginBottom: SPACE.lg },
  timelineCurrentTime: { fontSize: 44, fontWeight: FONT.w9, color: '#fff', lineHeight: 44 },
  nowPill: { backgroundColor: COLORS.accent, paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  nowPillText: { fontSize: 10, fontWeight: FONT.w8, color: '#fff', letterSpacing: 1 },
  timelineCurrentTitle: { fontSize: 28, fontWeight: FONT.w9, color: '#fff', letterSpacing: -0.3, lineHeight: 32 },
  speakerDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  timelineStatus: { fontSize: 10, fontWeight: FONT.w8, color: COLORS.textTer, letterSpacing: 1.5 },
  timelineOtherTime: { fontSize: FONT.xl, fontWeight: FONT.w9, color: COLORS.text, marginTop: SPACE.xs },
  timelineOtherTitle: { fontSize: FONT.md, fontWeight: FONT.w6, color: COLORS.textSec, marginTop: 2 },
  roomPill: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  roomPillText: { fontSize: 10, fontWeight: FONT.w6, color: COLORS.textTer },

  annCard: { borderRadius: 32, overflow: 'hidden', marginTop: SPACE.sm, ...SHADOW.lg },
  annTop: { height: 120, alignItems: 'center', justifyContent: 'center' },
  annBottom: { backgroundColor: COLORS.text, padding: SPACE.xl },
  annTime: { fontSize: 10, fontWeight: FONT.w7, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: SPACE.sm },
  annTitle: { fontSize: FONT.xl, fontWeight: FONT.w9, color: '#fff', lineHeight: 26, marginBottom: SPACE.sm },
  annBody: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
});
