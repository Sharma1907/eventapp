import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
  Platform, StatusBar, RefreshControl, ActivityIndicator,
  Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW, API_URL, API_HEADERS } from '../theme';
import SpeakerDetailScreen from './SpeakerDetailScreen';

const { width: W } = Dimensions.get('window');
const PAD = SPACE.xl;

// Gradient pairs for initials avatars
const GRAD_PAIRS = [
  ['#6366f1','#8b5cf6'],
  ['#0333b6','#06b6d4'],
  ['#0d9f6e','#06b6d4'],
  ['#dc2626','#f59e0b'],
  ['#7c3aed','#db2777'],
  ['#0891b2','#0d9f6e'],
  ['#d97706','#dc2626'],
];

function getGrad(idx) { return GRAD_PAIRS[idx % GRAD_PAIRS.length]; }

function AnimatedCard({ children, index, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 380,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[24,0] }) }],
    }, style]}>
      {children}
    </Animated.View>
  );
}

function SpeakerCard({ speaker, index, onPress }) {
  const [imgOk, setImgOk] = useState(true);
  const [pressed, setPressed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const [g1, g2] = getGrad(index);

  const onPressIn = () => {
    setPressed(true);
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  };
  const onPressOut = () => {
    setPressed(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <AnimatedCard index={index} style={{ marginBottom: SPACE.md }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[st.card, pressed && st.cardPressed]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.0)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Left: Avatar */}
          <View style={st.cardLeft}>
            {speaker.photo_url && imgOk ? (
              <Image
                source={{ uri: speaker.photo_url }}
                style={st.avatarImg}
                onError={() => setImgOk(false)}
              />
            ) : (
              <LinearGradient colors={[g1, g2]} style={st.avatarGrad}>
                <Text style={st.avatarInitials}>{speaker.initials}</Text>
              </LinearGradient>
            )}
            {speaker.is_keynote && (
              <View style={st.keynoteDot}>
                <Ionicons name="star" size={8} color="#fff" />
              </View>
            )}
          </View>

          {/* Right: Info */}
          <View style={st.cardBody}>
            <Text style={st.cardName} numberOfLines={1}>{speaker.full_name}</Text>
            <Text style={st.cardDesig} numberOfLines={2}>{speaker.designation}</Text>
            <View style={st.cardInstRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.4)" />
              <Text style={st.cardInst} numberOfLines={1}>{speaker.institute}</Text>
            </View>
            {speaker.talk_count > 0 && (
              <View style={st.talkBadge}>
                <Ionicons name="mic" size={10} color="rgba(255,255,255,0.7)" />
                <Text style={st.talkBadgeText}>{speaker.talk_count} talk{speaker.talk_count > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>

          {/* Arrow */}
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
        </TouchableOpacity>
      </Animated.View>
    </AnimatedCard>
  );
}

function SectionHeader({ label, count, icon, accent }) {
  return (
    <View style={[st.secHeader, { borderLeftColor: accent }]}>
      <View style={[st.secIconWrap, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <Text style={st.secLabel}>{label}</Text>
      <View style={[st.secCount, { backgroundColor: accent + '22' }]}>
        <Text style={[st.secCountText, { color: accent }]}>{count}</Text>
      </View>
    </View>
  );
}

export default function SpokersScreen({ tokens, onBack }) {
  const [keynotes, setKeynotes]   = useState([]);
  const [speakers, setSpeakers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetch_ = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/speakers/`, { headers: API_HEADERS });
      const data = await res.json();
      setKeynotes(data.keynotes || []);
      setSpeakers(data.speakers || []);
    } catch (e) { console.log('Speakers fetch error', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const onRefresh = () => { setRefreshing(true); fetch_(); };

  if (selectedId !== null) {
    return <SpeakerDetailScreen speakerId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const headerHeight = scrollY.interpolate({ inputRange:[0,80], outputRange:[1,0.92], extrapolate:'clamp' });

  return (
    <View style={{ flex:1, backgroundColor:'#050e2d' }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#050e2d','#0a1a5e','#050e2d']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative blobs */}
      <View style={st.blob1} />
      <View style={st.blob2} />
      <View style={st.blob3} />

      {/* Header */}
      <Animated.View style={[st.topbar, { opacity: headerHeight }]}>
        <TouchableOpacity onPress={onBack} style={st.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems:'center' }}>
          <Text style={st.topTitle}>Speakers</Text>
          <Text style={st.topSub}>ETD 2026</Text>
        </View>
        <View style={{ width:40 }} />
      </Animated.View>

      {loading ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={{ color:'rgba(255,255,255,0.5)', marginTop:12, fontSize:FONT.sm }}>
            Loading speakers...
          </Text>
        </View>
      ) : (
        <Animated.ScrollView
          onScroll={Animated.event([{ nativeEvent:{ contentOffset:{ y: scrollY } } }], { useNativeDriver:true })}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal:PAD, paddingTop:8, paddingBottom:60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {/* Hero */}
          <View style={st.hero}>
            <View style={st.heroPill}>
              <View style={st.heroPillDot} />
              <Text style={st.heroPillText}>ETD 2026 · IIT Delhi</Text>
            </View>
            <Text style={st.heroTitle}>Meet the{'\n'}Speakers</Text>
            <Text style={st.heroSub}>
              {(keynotes.length + speakers.length)} distinguished experts in{'\n'}library science & information technology
            </Text>
            {/* Stat pills */}
            <View style={st.statRow}>
              {[
                { label:'Keynotes', value: keynotes.length, icon:'star' },
                { label:'Speakers', value: speakers.length, icon:'mic'  },
                { label:'Countries', value: [...new Set([...keynotes,...speakers].map(s=>s.country).filter(Boolean))].length, icon:'globe' },
              ].map(s => (
                <View key={s.label} style={st.statPill}>
                  <Ionicons name={s.icon+'-outline'} size={13} color="rgba(255,255,255,0.6)" />
                  <Text style={st.statValue}>{s.value}</Text>
                  <Text style={st.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Keynotes */}
          {keynotes.length > 0 && (
            <View style={{ marginBottom: SPACE.lg }}>
              <SectionHeader
                label="Keynote Speakers"
                count={keynotes.length}
                icon="star"
                accent="#f59e0b"
              />
              {keynotes.map((sp, i) => (
                <SpeakerCard
                  key={sp.id} speaker={sp} index={i}
                  onPress={() => setSelectedId(sp.id)}
                />
              ))}
            </View>
          )}

          {/* All Speakers */}
          {speakers.length > 0 && (
            <View>
              <SectionHeader
                label="Invited Speakers"
                count={speakers.length}
                icon="people"
                accent="#60a5fa"
              />
              {speakers.map((sp, i) => (
                <SpeakerCard
                  key={sp.id} speaker={sp} index={i}
                  onPress={() => setSelectedId(sp.id)}
                />
              ))}
            </View>
          )}

          {keynotes.length === 0 && speakers.length === 0 && (
            <View style={st.empty}>
              <Ionicons name="mic-off-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={st.emptyText}>No speakers added yet</Text>
            </View>
          )}
        </Animated.ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  /* Decorative */
  blob1:{ position:'absolute', width:300, height:300, borderRadius:150, backgroundColor:'rgba(99,102,241,0.08)', top:-80, right:-100 },
  blob2:{ position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'rgba(245,158,11,0.06)', top:200, left:-80 },
  blob3:{ position:'absolute', width:250, height:250, borderRadius:125, backgroundColor:'rgba(6,182,212,0.05)', bottom:100, right:-60 },

  topbar:{
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingTop: Platform.OS==='ios' ? 54 : 44,
    paddingBottom: SPACE.md, paddingHorizontal: PAD,
  },
  backBtn:{
    width:40, height:40, borderRadius:20,
    backgroundColor:'rgba(255,255,255,0.1)',
    alignItems:'center', justifyContent:'center',
    borderWidth:1, borderColor:'rgba(255,255,255,0.15)',
  },
  topTitle:{ fontSize:FONT.md, fontWeight:FONT.w8, color:'#fff' },
  topSub:{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:1.5, marginTop:1 },

  /* Hero */
  hero:{ paddingTop:SPACE.md, paddingBottom:SPACE.xxl },
  heroPill:{
    flexDirection:'row', alignItems:'center', gap:SPACE.sm,
    backgroundColor:'rgba(255,255,255,0.07)',
    borderWidth:1, borderColor:'rgba(255,255,255,0.1)',
    borderRadius:RADIUS.full, paddingHorizontal:SPACE.md, paddingVertical:6,
    alignSelf:'flex-start', marginBottom:SPACE.lg,
  },
  heroPillDot:{ width:6, height:6, borderRadius:3, backgroundColor:'#60a5fa' },
  heroPillText:{ fontSize:11, fontWeight:FONT.w7, color:'rgba(255,255,255,0.6)', letterSpacing:1 },
  heroTitle:{
    fontSize:40, fontWeight:FONT.w9, color:'#fff',
    letterSpacing:-1, lineHeight:44, marginBottom:SPACE.md,
  },
  heroSub:{ fontSize:FONT.sm, color:'rgba(255,255,255,0.5)', lineHeight:20, marginBottom:SPACE.xl },
  statRow:{ flexDirection:'row', gap:SPACE.md },
  statPill:{
    flex:1, backgroundColor:'rgba(255,255,255,0.07)',
    borderWidth:1, borderColor:'rgba(255,255,255,0.1)',
    borderRadius:14, padding:SPACE.md, alignItems:'center', gap:4,
  },
  statValue:{ fontSize:FONT.xl, fontWeight:FONT.w9, color:'#fff' },
  statLabel:{ fontSize:9, fontWeight:FONT.w7, color:'rgba(255,255,255,0.4)', letterSpacing:0.8, textTransform:'uppercase' },

  /* Section */
  secHeader:{
    flexDirection:'row', alignItems:'center', gap:SPACE.md,
    marginBottom:SPACE.lg, paddingLeft:SPACE.md,
    borderLeftWidth:3, borderLeftColor:'#f59e0b',
  },
  secIconWrap:{ width:28, height:28, borderRadius:8, alignItems:'center', justifyContent:'center' },
  secLabel:{ flex:1, fontSize:FONT.base, fontWeight:FONT.w8, color:'#fff' },
  secCount:{
    paddingHorizontal:SPACE.sm, paddingVertical:3,
    borderRadius:RADIUS.full, minWidth:26, alignItems:'center',
  },
  secCountText:{ fontSize:11, fontWeight:FONT.w8 },

  /* Speaker card */
  card:{
    flexDirection:'row', alignItems:'center', gap:SPACE.md,
    backgroundColor:'rgba(255,255,255,0.06)',
    borderRadius:20, padding:SPACE.lg,
    borderWidth:1, borderColor:'rgba(255,255,255,0.09)',
    overflow:'hidden',
    ...Platform.select({
      ios:{ shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:12 },
      android:{ elevation:0 },
    }),
  },
  cardPressed:{ borderColor:'rgba(255,255,255,0.2)', backgroundColor:'rgba(255,255,255,0.1)' },

  cardLeft:{ position:'relative' },
  avatarImg:{ width:56, height:56, borderRadius:16, borderWidth:2, borderColor:'rgba(255,255,255,0.2)' },
  avatarGrad:{ width:56, height:56, borderRadius:16, alignItems:'center', justifyContent:'center' },
  avatarInitials:{ fontSize:20, fontWeight:FONT.w9, color:'#fff' },
  keynoteDot:{
    position:'absolute', bottom:-2, right:-2,
    width:16, height:16, borderRadius:8,
    backgroundColor:'#f59e0b',
    alignItems:'center', justifyContent:'center',
    borderWidth:2, borderColor:'#050e2d',
  },

  cardBody:{ flex:1 },
  cardName:{ fontSize:FONT.base, fontWeight:FONT.w8, color:'#fff', marginBottom:2 },
  cardDesig:{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:16, marginBottom:5 },
  cardInstRow:{ flexDirection:'row', alignItems:'center', gap:3 },
  cardInst:{ fontSize:10, color:'rgba(255,255,255,0.35)', flex:1 },
  talkBadge:{
    flexDirection:'row', alignItems:'center', gap:4,
    backgroundColor:'rgba(96,165,250,0.15)',
    borderWidth:1, borderColor:'rgba(96,165,250,0.2)',
    borderRadius:6, paddingHorizontal:6, paddingVertical:2,
    alignSelf:'flex-start', marginTop:6,
  },
  talkBadgeText:{ fontSize:9, fontWeight:FONT.w7, color:'rgba(255,255,255,0.6)', letterSpacing:0.5 },

  empty:{ alignItems:'center', paddingVertical:60, gap:SPACE.md },
  emptyText:{ fontSize:FONT.base, color:'rgba(255,255,255,0.3)' },
});
