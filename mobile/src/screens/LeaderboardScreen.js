import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, RefreshControl,
  StyleSheet, Platform, StatusBar, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW, fixMediaUrl } from '../theme';
import { apiFetch } from '../api';
import { GradientAvatar, PulsingDot } from '../components';

const PAD = SPACE.xl;

const ACTION_ICONS = {
  signup: 'person-add',
  checkin: 'qr-code',
  meal: 'restaurant',
  poll_vote: 'stats-chart',
  photo_upload: 'camera',
  profile_completion: 'checkmark-circle',
  feedback: 'chatbox-ellipses',
  networking: 'people',
  daily_login: 'sunny',
};

const ACTION_COLORS = {
  signup: COLORS.brand,
  checkin: COLORS.success,
  meal: COLORS.accent,
  poll_vote: COLORS.purple,
  photo_upload: COLORS.teal,
  profile_completion: COLORS.success,
  feedback: COLORS.brand,
  networking: COLORS.rose,
  daily_login: COLORS.accent,
};

const MEDAL = {
  1: { colors: ['#fbbf24', '#f59e0b'], ring: '#fde68a', icon: 'trophy' },
  2: { colors: ['#d1d5db', '#9ca3af'], ring: '#e5e7eb', icon: 'medal' },
  3: { colors: ['#d97706', '#b45309'], ring: '#fdba74', icon: 'ribbon' },
};

function AnimatedNumber({ value, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value || 0,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [value, anim]);

  return <Text style={style}>{display.toLocaleString()}</Text>;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function RankOrb({ rank, points, gap, nextName }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();
  }, [pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.34] });

  return (
    <View style={orb.wrap}>
      <Animated.View style={[orb.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
      <LinearGradient colors={[COLORS.brandDeep, COLORS.brand]} style={orb.core}>
        <Text style={orb.kicker}>YOUR RANK</Text>
        <Text style={orb.rank}>#{rank || '—'}</Text>
        <View style={orb.pointsRow}>
          <AnimatedNumber value={points || 0} style={orb.points} />
          <Text style={orb.pointsLabel}>pts</Text>
        </View>
        {gap > 0 && !!nextName && (
          <View style={orb.chasePill}>
            <Ionicons name="flash" size={12} color="#fff" />
            <Text style={orb.chaseText}>{gap} pts to beat {nextName}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

function SpotlightCard({ entry, slot }) {
  const medal = MEDAL[entry.rank] || { colors: [COLORS.brand, COLORS.brandDark], ring: COLORS.brandLight, icon: 'sparkles' };
  const configs = {
    left:   { width: '29%', top: 28, rotate: '-7deg', scale: 0.92 },
    center: { width: '36%', top: 0,  rotate: '0deg',  scale: 1 },
    right:  { width: '29%', top: 28, rotate: '7deg',  scale: 0.92 },
  };
  const cfg = configs[slot];

  return (
    <View style={[pod.cardWrap, { width: cfg.width, marginTop: cfg.top, transform: [{ rotate: cfg.rotate }, { scale: cfg.scale }] }]}>
      <LinearGradient colors={medal.colors} style={pod.card}>
        <View style={pod.topRow}>
          <View style={pod.rankChip}>
            <Text style={pod.rankChipText}>#{entry.rank}</Text>
          </View>
          {entry.is_me && (
            <View style={pod.youChip}>
              <Text style={pod.youChipText}>YOU</Text>
            </View>
          )}
        </View>

        <View style={[pod.avatarRing, { borderColor: medal.ring }]}>
          {entry.profile_photo_url ? (
            <Image source={{ uri: fixMediaUrl(entry.profile_photo_url) }} style={pod.avatar} />
          ) : (
            <GradientAvatar name={entry.name} size={slot === 'center' ? 68 : 56} radius={slot === 'center' ? 34 : 28} />
          )}
        </View>

        <Text style={pod.name} numberOfLines={2}>{entry.name}</Text>
        {!!entry.affiliation && <Text style={pod.aff} numberOfLines={2}>{entry.affiliation}</Text>}

        <View style={pod.bottomRow}>
          <Ionicons name={medal.icon} size={slot === 'center' ? 18 : 14} color="#fff" />
          <Text style={pod.points}>{entry.points.toLocaleString()} pts</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function StandingCard({ entry }) {
  if (!entry) return null;
  return (
    <View style={stand.card}>
      <LinearGradient colors={['rgba(3,51,182,0.10)', 'rgba(245,158,11,0.08)']} style={stand.bg} />
      <View style={stand.left}>
        <View style={stand.rankBubble}>
          <Text style={stand.rankText}>#{entry.rank}</Text>
        </View>
        {entry.profile_photo_url ? (
          <Image source={{ uri: fixMediaUrl(entry.profile_photo_url) }} style={stand.avatar} />
        ) : (
          <GradientAvatar name={entry.name} size={44} radius={22} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={stand.title}>Your Standing</Text>
          <Text style={stand.name} numberOfLines={1}>{entry.name}</Text>
          <Text style={stand.aff} numberOfLines={1}>{entry.affiliation || 'Checked-in participant'}</Text>
        </View>
      </View>
      <View style={stand.right}>
        <Text style={stand.points}>{entry.points.toLocaleString()}</Text>
        <Text style={stand.pointsLabel}>points</Text>
      </View>
    </View>
  );
}

function LeaderboardRow({ entry }) {
  return (
    <View style={[row.card, entry.is_me && row.cardMe]}>
      <View style={[row.rankPill, entry.is_me && row.rankPillMe]}>
        <Text style={[row.rankText, entry.is_me && row.rankTextMe]}>#{entry.rank}</Text>
      </View>

      {entry.profile_photo_url ? (
        <Image source={{ uri: fixMediaUrl(entry.profile_photo_url) }} style={row.avatar} />
      ) : (
        <GradientAvatar name={entry.name} size={46} radius={23} />
      )}

      <View style={row.info}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[row.name, entry.is_me && row.nameMe]} numberOfLines={1}>{entry.name}</Text>
          {entry.is_me && <View style={row.youChip}><Text style={row.youChipText}>YOU</Text></View>}
        </View>
        <Text style={row.aff} numberOfLines={1}>{entry.affiliation || 'Participant'}</Text>
      </View>

      <View style={row.pointsWrap}>
        <Text style={[row.points, entry.is_me && row.pointsMe]}>{entry.points.toLocaleString()}</Text>
        <Text style={row.pointsLabel}>pts</Text>
      </View>
    </View>
  );
}

function ActivityItem({ item, index }) {
  const icon = ACTION_ICONS[item.action] || 'ellipse';
  const color = ACTION_COLORS[item.action] || COLORS.textSec;
  const timeAgo = formatTimeAgo(item.date);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay: index * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View style={[
      activity.item,
      {
        opacity: anim,
        transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
      },
    ]}>
      <View style={activity.rail}>
        <View style={[activity.dot, { backgroundColor: color }]} />
        {index < 14 && <View style={activity.line} />}
      </View>

      <View style={[activity.iconWrap, { backgroundColor: `${color}16` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={activity.action}>{item.action_display}</Text>
        {!!item.note && <Text style={activity.note} numberOfLines={1}>{item.note}</Text>}
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={activity.points}>+{item.points}</Text>
        <Text style={activity.time}>{timeAgo}</Text>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardScreen({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myData, setMyData] = useState(null);
  const [topData, setTopData] = useState(null);
  const [tab, setTab] = useState('rankings');

  const fetchData = useCallback(async () => {
    try {
      const [myRes, topRes] = await Promise.all([
        apiFetch('/leaderboard/my/'),
        apiFetch('/leaderboard/top/'),
      ]);
      const myJson = myRes.ok ? await myRes.json() : null;
      const topJson = topRes.ok ? await topRes.json() : null;
      setMyData(myJson);
      setTopData(topJson);
    } catch (e) {
      console.log('leaderboard fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const leaderboard = useMemo(
    () => (Array.isArray(topData?.leaderboard) ? topData.leaderboard : []),
    [topData]
  );

  const eligible = myData ? !!myData.eligible : true;
  const top3 = leaderboard.slice(0, 3);
  const top3Ids = new Set(top3.map(x => x.user_id));
  const rest = leaderboard.filter(x => !top3Ids.has(x.user_id));
  const myEntry = topData?.my_entry || leaderboard.find(x => x.is_me) || null;

  const myRank = topData?.my_rank || myData?.rank || 0;
  const myPoints = topData?.my_points ?? myData?.total_points ?? 0;
  const nextGap = myData?.next_gap || 0;
  const nextName = myData?.next_rank_name || '';
  const totalParticipants = topData?.total_participants || 0;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[COLORS.brandDeep, COLORS.brand]} style={s.header}>
        <View style={s.blob1} />
        <View style={s.blob2} />

        <View style={s.topbar}>
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Leaderboard</Text>
          <View style={{ width: 42 }} />
        </View>

        <RankOrb rank={eligible ? myRank : 0} points={myPoints} gap={eligible ? nextGap : 0} nextName={eligible ? nextName : ''} />

        <View style={s.tabRow}>
          <TouchableOpacity
            activeOpacity={0.86}
            style={[s.tabBtn, tab === 'rankings' && s.tabBtnOn]}
            onPress={() => setTab('rankings')}
          >
            <Ionicons name="trophy-outline" size={16} color={tab === 'rankings' ? '#fff' : 'rgba(255,255,255,0.65)'} />
            <Text style={[s.tabText, tab === 'rankings' && s.tabTextOn]}>Rankings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.86}
            style={[s.tabBtn, tab === 'activity' && s.tabBtnOn]}
            onPress={() => setTab('activity')}
          >
            <Ionicons name="pulse-outline" size={16} color={tab === 'activity' ? '#fff' : 'rgba(255,255,255,0.65)'} />
            <Text style={[s.tabText, tab === 'activity' && s.tabTextOn]}>Activity</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={s.loadingWrap}>
            <PulsingDot color={COLORS.brand} size={11} />
            <Text style={s.loadingText}>Loading leaderboard…</Text>
          </View>
        ) : !eligible ? (
          <View style={s.lockWrap}>
            <LinearGradient colors={['#fff', COLORS.brandLight]} style={s.lockCard}>
              <View style={s.lockIcon}>
                <Ionicons name="shield-checkmark-outline" size={34} color={COLORS.brand} />
              </View>
              <Text style={s.lockTitle}>Check in to join the leaderboard</Text>
              <Text style={s.lockText}>
                Only conference checked-in participants are ranked. Your points are safe — your rank will appear after conference check-in.
              </Text>
              <View style={s.lockStatRow}>
                <View style={s.lockStat}>
                  <Text style={s.lockStatValue}>{myPoints}</Text>
                  <Text style={s.lockStatLabel}>Your Points</Text>
                </View>
                <View style={s.lockStat}>
                  <Text style={s.lockStatValue}>{totalParticipants}</Text>
                  <Text style={s.lockStatLabel}>Checked-in</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : tab === 'rankings' ? (
          <>
            <View style={s.sectionWrap}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>Top Players</Text>
                <View style={s.metaPill}>
                  <Ionicons name="people-outline" size={12} color={COLORS.brand} />
                  <Text style={s.metaPillText}>{totalParticipants}</Text>
                </View>
              </View>

              <View style={s.spotlight}>
                {!!top3[1] && <SpotlightCard entry={top3[1]} slot="left" />}
                {!!top3[0] && <SpotlightCard entry={top3[0]} slot="center" />}
                {!!top3[2] && <SpotlightCard entry={top3[2]} slot="right" />}
              </View>
            </View>

            {!!myEntry && !top3Ids.has(myEntry.user_id) && (
              <View style={s.sectionWrap}>
                <StandingCard entry={myEntry} />
              </View>
            )}

            <View style={s.sectionWrap}>
              <Text style={s.sectionTitle}>All Checked-in Rankings</Text>
              {rest.length ? rest.map((entry) => (
                <LeaderboardRow key={entry.user_id} entry={entry} />
              )) : (
                <View style={s.emptyCard}>
                  <Text style={s.emptyText}>More participants will appear here as they score points.</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={s.sectionWrap}>
              <Text style={s.sectionTitle}>Your Recent Activity</Text>
              {(myData?.history || []).length ? (
                (myData.history || []).map((item, i) => (
                  <ActivityItem key={`${item.action}-${item.date}-${i}`} item={item} index={i} />
                ))
              ) : (
                <View style={s.emptyCard}>
                  <Text style={s.emptyText}>No point activity yet.</Text>
                </View>
              )}
            </View>

            <View style={s.sectionWrap}>
              <Text style={s.sectionTitle}>How to Climb</Text>
              <View style={s.tipGrid}>
                {[
                  { icon: 'qr-code-outline', label: 'Conference Check-in', pts: '+20' },
                  { icon: 'restaurant-outline', label: 'Meal Check-in', pts: '+10' },
                  { icon: 'checkmark-circle-outline', label: 'Complete Profile', pts: '+50' },
                  { icon: 'chatbox-ellipses-outline', label: 'Session Feedback', pts: '+25' },
                ].map((x) => (
                  <View key={x.label} style={s.tipCard}>
                    <View style={s.tipIcon}>
                      <Ionicons name={x.icon} size={20} color={COLORS.brand} />
                    </View>
                    <Text style={s.tipLabel}>{x.label}</Text>
                    <Text style={s.tipPts}>{x.pts}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const orb = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: SPACE.sm, marginBottom: SPACE.lg },
  glow: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.22)',
    top: 8,
  },
  core: {
    width: 196, height: 196, borderRadius: 98,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  kicker: { fontSize: 10, fontWeight: FONT.w8, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.6 },
  rank: { fontSize: 44, fontWeight: FONT.w9, color: '#fff', marginTop: 6, letterSpacing: -0.6 },
  pointsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  points: { fontSize: 22, fontWeight: FONT.w9, color: '#fff' },
  pointsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: FONT.w6 },
  chasePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: SPACE.md, paddingVertical: 7,
    borderRadius: RADIUS.full, marginTop: SPACE.md,
  },
  chaseText: { fontSize: 11, fontWeight: FONT.w7, color: '#fff' },
});

const pod = StyleSheet.create({
  cardWrap: { alignSelf: 'flex-start' },
  card: {
    borderRadius: 24,
    padding: SPACE.md,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16, shadowRadius: 18 },
      android: { elevation: 8 },
    }),
  },
  topRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rankChip: {
    paddingHorizontal: SPACE.sm, paddingVertical: 5, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  rankChipText: { fontSize: 11, fontWeight: FONT.w8, color: '#fff' },
  youChip: {
    paddingHorizontal: SPACE.sm, paddingVertical: 5, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(15,23,42,0.28)',
  },
  youChipText: { fontSize: 10, fontWeight: FONT.w8, color: '#fff', letterSpacing: 0.5 },
  avatarRing: {
    borderWidth: 3,
    borderRadius: 40,
    padding: 3,
    marginTop: SPACE.md,
  },
  avatar: { width: 62, height: 62, borderRadius: 31 },
  name: { fontSize: FONT.sm, fontWeight: FONT.w8, color: '#fff', textAlign: 'center', marginTop: SPACE.sm },
  aff: { fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 2 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACE.md },
  points: { fontSize: FONT.sm, fontWeight: FONT.w8, color: '#fff' },
});

const stand = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(3,51,182,0.08)',
    padding: SPACE.lg,
    ...SHADOW.sm,
  },
  bg: { ...StyleSheet.absoluteFillObject },
  left: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, flex: 1 },
  rankBubble: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: FONT.md, fontWeight: FONT.w9, color: '#fff' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  title: { fontSize: 10, fontWeight: FONT.w8, color: COLORS.textTer, letterSpacing: 1.2 },
  name: { fontSize: FONT.md, fontWeight: FONT.w8, color: COLORS.text, marginTop: 2 },
  aff: { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2 },
  right: { position: 'absolute', right: SPACE.lg, top: SPACE.lg, alignItems: 'flex-end' },
  points: { fontSize: FONT.xl, fontWeight: FONT.w9, color: COLORS.brand },
  pointsLabel: { fontSize: 11, color: COLORS.textTer },
});

const row = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.md,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: SPACE.md,
    marginBottom: SPACE.sm,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 1 },
    }),
  },
  cardMe: { borderWidth: 1.2, borderColor: COLORS.brand, backgroundColor: COLORS.brandLight },
  rankPill: {
    minWidth: 44, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#eef2f7',
  },
  rankPillMe: { backgroundColor: COLORS.brand },
  rankText: { fontSize: FONT.sm, fontWeight: FONT.w8, color: COLORS.textSec },
  rankTextMe: { color: '#fff' },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  info: { flex: 1 },
  name: { fontSize: FONT.md, fontWeight: FONT.w8, color: COLORS.text },
  nameMe: { color: COLORS.brand },
  aff: { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2 },
  youChip: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACE.xs + 2, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  youChipText: { fontSize: 9, fontWeight: FONT.w8, color: '#fff' },
  pointsWrap: { alignItems: 'flex-end' },
  points: { fontSize: FONT.lg, fontWeight: FONT.w9, color: COLORS.text },
  pointsMe: { color: COLORS.brand },
  pointsLabel: { fontSize: 10, color: COLORS.textTer },
});

const activity = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md,
    marginBottom: SPACE.md,
  },
  rail: { width: 16, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 16 },
  line: { width: 2, flex: 1, backgroundColor: 'rgba(148,163,184,0.25)', marginTop: 6, minHeight: 46 },
  iconWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  action: { fontSize: FONT.sm, fontWeight: FONT.w8, color: COLORS.text },
  note: { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2 },
  points: { fontSize: FONT.md, fontWeight: FONT.w8, color: COLORS.success },
  time: { fontSize: 10, color: COLORS.textTer, marginTop: 2 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f6fb' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: SPACE.xl,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    top: -50, right: -20,
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blob2: {
    position: 'absolute',
    bottom: -40, left: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(245,158,11,0.10)',
  },
  topbar: {
    paddingHorizontal: PAD,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FONT.xl, fontWeight: FONT.w8, color: '#fff', letterSpacing: -0.2 },

  tabRow: {
    marginHorizontal: PAD,
    marginTop: SPACE.md,
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  tabBtnOn: { backgroundColor: 'rgba(255,255,255,0.18)' },
  tabText: { fontSize: FONT.sm, fontWeight: FONT.w7, color: 'rgba(255,255,255,0.7)' },
  tabTextOn: { color: '#fff' },

  loadingWrap: { alignItems: 'center', paddingVertical: SPACE.xxl * 2 },
  loadingText: { fontSize: FONT.sm, color: COLORS.textSec, marginTop: SPACE.md },

  sectionWrap: { paddingHorizontal: PAD, marginTop: SPACE.xl },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE.md },
  sectionTitle: { fontSize: FONT.lg, fontWeight: FONT.w9, color: COLORS.text, letterSpacing: -0.2 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.brandLight,
    paddingHorizontal: SPACE.sm, paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  metaPillText: { fontSize: 11, fontWeight: FONT.w8, color: COLORS.brand },

  spotlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 265,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: SPACE.xl,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
  },
  emptyText: { fontSize: FONT.sm, color: COLORS.textTer, textAlign: 'center' },

  lockWrap: { paddingHorizontal: PAD, marginTop: SPACE.xl },
  lockCard: {
    borderRadius: 28,
    padding: SPACE.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(3,51,182,0.08)',
    ...SHADOW.lg,
  },
  lockIcon: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACE.lg,
  },
  lockTitle: { fontSize: FONT.xl, fontWeight: FONT.w9, color: COLORS.text, textAlign: 'center', marginBottom: SPACE.sm },
  lockText: { fontSize: FONT.sm, color: COLORS.textSec, textAlign: 'center', lineHeight: 21 },
  lockStatRow: { marginTop: SPACE.xl, flexDirection: 'row', gap: SPACE.xl },
  lockStat: { alignItems: 'center' },
  lockStatValue: { fontSize: FONT.xxl, fontWeight: FONT.w9, color: COLORS.brand },
  lockStatLabel: { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 3 },

  tipGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: SPACE.md },
  tipCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: SPACE.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 1 },
    }),
  },
  tipIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACE.sm,
  },
  tipLabel: { fontSize: FONT.xs, fontWeight: FONT.w7, color: COLORS.textSec, textAlign: 'center' },
  tipPts: { fontSize: FONT.md, fontWeight: FONT.w9, color: COLORS.brand, marginTop: 4 },
});
