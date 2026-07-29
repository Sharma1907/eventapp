import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
  Platform, StatusBar, ActivityIndicator, Linking, Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW, API_URL, API_HEADERS } from '../theme';

const { width: W } = Dimensions.get('window');
const PAD = SPACE.xl;

const GRAD_PAIRS = [
  ['#6366f1','#8b5cf6'],['#0333b6','#06b6d4'],['#0d9f6e','#06b6d4'],
  ['#dc2626','#f59e0b'],['#7c3aed','#db2777'],['#0891b2','#0d9f6e'],
];

function FadeCard({ children, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue:1, duration:400, delay, useNativeDriver:true }).start();
  }, []);
  return (
    <Animated.View style={[{
      opacity: anim,
      transform:[{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[20,0] }) }],
    }, style]}>
      {children}
    </Animated.View>
  );
}

function InfoRow({ icon, label, value, onPress, color }) {
  if (!value) return null;
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={st.infoRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[st.infoIcon, { backgroundColor: (color || COLORS.brand) + '18' }]}>
        <Ionicons name={icon} size={18} color={color || COLORS.brand} />
      </View>
      <View style={{ flex:1 }}>
        <Text style={st.infoLabel}>{label}</Text>
        <Text style={st.infoValue} numberOfLines={3}>{value}</Text>
      </View>
      {onPress && <Ionicons name="open-outline" size={16} color={COLORS.textTer} />}
    </Wrap>
  );
}

function SocialBtn({ icon, label, url, color, bgColor }) {
  if (!url) return null;
  return (
    <TouchableOpacity
      style={[st.socialBtn, { backgroundColor: bgColor || color + '18', borderColor: color + '30' }]}
      onPress={() => Linking.openURL(url).catch(() => {})}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[st.socialLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TalkCard({ talk, index }) {
  return (
    <FadeCard delay={index * 80} style={st.talkCard}>
      <LinearGradient
        colors={['rgba(3,51,182,0.06)', 'rgba(3,51,182,0.02)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={st.talkHeader}>
        <View style={st.talkNumWrap}>
          <Text style={st.talkNum}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
        <View style={{ flex:1 }}>
          {!!talk.track && (
            <View style={st.trackBadge}>
              <Text style={st.trackBadgeText}>{talk.track}</Text>
            </View>
          )}
          <Text style={st.talkTitle}>{talk.title}</Text>
        </View>
      </View>
      {(!!talk.talk_date || !!talk.talk_time) && (
        <View style={st.talkMeta}>
          {!!talk.talk_date && (
            <View style={st.talkMetaItem}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.textTer} />
              <Text style={st.talkMetaText}>{talk.talk_date}</Text>
            </View>
          )}
          {!!talk.talk_time && (
            <View style={st.talkMetaItem}>
              <Ionicons name="time-outline" size={12} color={COLORS.textTer} />
              <Text style={st.talkMetaText}>{talk.talk_time}</Text>
            </View>
          )}
        </View>
      )}
      {!!talk.abstract && (
        <Text style={st.talkAbstract}>{talk.abstract}</Text>
      )}
    </FadeCard>
  );
}

export default function SpeakerDetailScreen({ speakerId, onBack }) {
  const [speaker, setSpeaker]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [imgOk, setImgOk]       = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/speakers/${speakerId}/`, { headers: API_HEADERS });
        const data = await res.json();
        setSpeaker(data);
      } catch (e) { console.log('Speaker detail error', e); }
      finally { setLoading(false); }
    })();
  }, [speakerId]);

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor:'#050e2d', alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!speaker) {
    return (
      <View style={{ flex:1, backgroundColor:'#050e2d', alignItems:'center', justifyContent:'center', padding:PAD }}>
        <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.3)" />
        <Text style={{ color:'rgba(255,255,255,0.6)', marginTop:12, textAlign:'center' }}>
          Speaker not found.
        </Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop:16, padding:SPACE.md }}>
          <Text style={{ color:COLORS.accent, fontWeight:FONT.w7 }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [g1, g2] = GRAD_PAIRS[speaker.id % GRAD_PAIRS.length];
  const hasSocial = speaker.linkedin_url || speaker.twitter_url ||
                    speaker.google_scholar_url || speaker.researchgate_url ||
                    speaker.website_url;

  // Parallax on hero
  const heroTranslate = scrollY.interpolate({
    inputRange:[-100, 0, 200], outputRange:[50, 0, -60], extrapolate:'clamp',
  });

  return (
    <View style={{ flex:1, backgroundColor:'#f0f4f9' }}>
      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent:{ contentOffset:{ y: scrollY } } }],
          { useNativeDriver:true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom:48 }}
      >
        {/* ── HERO ─────────────────────────────────────────────── */}
        <View style={st.heroWrap}>
          <LinearGradient colors={['#050e2d','#0a1a5e','#0333b6']} style={st.heroBg} />

          {/* Decorative blobs */}
          <Animated.View style={[st.hBlob1, { transform:[{ translateY: heroTranslate }] }]} />
          <Animated.View style={[st.hBlob2, { transform:[{ translateY: heroTranslate }] }]} />

          {/* Topbar */}
          <View style={st.heroTopbar}>
            <TouchableOpacity onPress={onBack} style={st.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            {speaker.is_keynote && (
              <View style={st.keynoteBadge}>
                <Ionicons name="star" size={10} color="#fde68a" />
                <Text style={st.keynoteBadgeText}>KEYNOTE</Text>
              </View>
            )}
            <View style={{ width:40 }} />
          </View>

          {/* Avatar */}
          <View style={st.heroAvatarWrap}>
            {speaker.photo_url && imgOk ? (
              <Image
                source={{ uri: speaker.photo_url }}
                style={st.heroAvatarImg}
                onError={() => setImgOk(false)}
              />
            ) : (
              <LinearGradient colors={[g1, g2]} style={st.heroAvatarGrad}>
                <Text style={st.heroAvatarInitials}>{speaker.initials}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Name & info */}
          <View style={st.heroInfo}>
            <Text style={st.heroName}>{speaker.full_name}</Text>
            {!!speaker.designation && (
              <Text style={st.heroDesig}>{speaker.designation}</Text>
            )}
            <View style={st.heroInstRow}>
              <Ionicons name="business-outline" size={13} color="rgba(255,255,255,0.5)" />
              <Text style={st.heroInst} numberOfLines={2}>{speaker.institute}</Text>
            </View>
            {!!speaker.country && (
              <View style={st.heroInstRow}>
                <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.5)" />
                <Text style={st.heroInst}>{speaker.country}</Text>
              </View>
            )}
          </View>

          {/* Quick stat pills */}
          <View style={st.heroStats}>
            {speaker.talks && speaker.talks.length > 0 && (
              <View style={st.heroStatPill}>
                <Ionicons name="mic-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={st.heroStatText}>{speaker.talks.length} Talk{speaker.talks.length > 1 ? 's' : ''}</Text>
              </View>
            )}
            {!!speaker.country && (
              <View style={st.heroStatPill}>
                <Ionicons name="globe-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={st.heroStatText}>{speaker.country}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── CONTENT ──────────────────────────────────────────── */}
        <View style={st.content}>

          {/* Bio */}
          {!!speaker.bio && (
            <FadeCard delay={0} style={st.card}>
              <View style={st.cardTitleRow}>
                <View style={[st.cardIcon, { backgroundColor:'#0333b618' }]}>
                  <Ionicons name="person-outline" size={16} color={COLORS.brand} />
                </View>
                <Text style={st.cardTitle}>About</Text>
              </View>
              <Text style={st.bioText}>{speaker.bio}</Text>
            </FadeCard>
          )}

          {/* Talks */}
          {speaker.talks && speaker.talks.length > 0 && (
            <FadeCard delay={80} style={st.card}>
              <View style={st.cardTitleRow}>
                <View style={[st.cardIcon, { backgroundColor:'#7c3aed18' }]}>
                  <Ionicons name="mic-outline" size={16} color="#7c3aed" />
                </View>
                <Text style={st.cardTitle}>Talk{speaker.talks.length > 1 ? 's' : ''}</Text>
                <View style={st.talkCountBadge}>
                  <Text style={st.talkCountText}>{speaker.talks.length}</Text>
                </View>
              </View>
              {speaker.talks.map((t, i) => (
                <TalkCard key={t.id} talk={t} index={i} />
              ))}
            </FadeCard>
          )}

          {/* Contact */}
          {(speaker.email || speaker.website_url) && (
            <FadeCard delay={160} style={st.card}>
              <View style={st.cardTitleRow}>
                <View style={[st.cardIcon, { backgroundColor:'#0d9f6e18' }]}>
                  <Ionicons name="mail-outline" size={16} color="#0d9f6e" />
                </View>
                <Text style={st.cardTitle}>Contact</Text>
              </View>
              <InfoRow
                icon="mail-outline" label="Email" value={speaker.email}
                color="#0d9f6e"
                onPress={speaker.email ? () => Linking.openURL(`mailto:${speaker.email}`).catch(()=>{}) : null}
              />
              <InfoRow
                icon="globe-outline" label="Website" value={speaker.website_url}
                color={COLORS.brand}
                onPress={speaker.website_url ? () => Linking.openURL(speaker.website_url).catch(()=>{}) : null}
              />
            </FadeCard>
          )}

          {/* Connect / Social */}
          {hasSocial && (
            <FadeCard delay={240} style={st.card}>
              <View style={st.cardTitleRow}>
                <View style={[st.cardIcon, { backgroundColor:'#0a66c218' }]}>
                  <Ionicons name="share-social-outline" size={16} color="#0a66c2" />
                </View>
                <Text style={st.cardTitle}>Connect</Text>
              </View>
              <View style={st.socialGrid}>
                <SocialBtn
                  icon="logo-linkedin" label="LinkedIn"
                  url={speaker.linkedin_url} color="#0a66c2"
                />
                <SocialBtn
                  icon="logo-twitter" label="Twitter"
                  url={speaker.twitter_url} color="#1da1f2"
                />
                <SocialBtn
                  icon="school-outline" label="Scholar"
                  url={speaker.google_scholar_url} color="#4285f4"
                />
                <SocialBtn
                  icon="flask-outline" label="ResearchGate"
                  url={speaker.researchgate_url} color="#00ccbb"
                />
              </View>
            </FadeCard>
          )}

        </View>
      </Animated.ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  /* Hero */
  heroWrap:{ position:'relative', overflow:'hidden', paddingBottom: SPACE.xxl + SPACE.xl },
  heroBg:{ ...StyleSheet.absoluteFillObject },
  hBlob1:{ position:'absolute', width:260, height:260, borderRadius:130, backgroundColor:'rgba(99,102,241,0.1)', top:-60, right:-80 },
  hBlob2:{ position:'absolute', width:180, height:180, borderRadius:90, backgroundColor:'rgba(245,158,11,0.08)', bottom:40, left:-60 },

  heroTopbar:{
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingTop: Platform.OS==='ios' ? 54 : 44,
    paddingHorizontal: PAD, paddingBottom: SPACE.xl,
  },
  backBtn:{
    width:40, height:40, borderRadius:20,
    backgroundColor:'rgba(255,255,255,0.1)',
    alignItems:'center', justifyContent:'center',
    borderWidth:1, borderColor:'rgba(255,255,255,0.15)',
  },
  keynoteBadge:{
    flexDirection:'row', alignItems:'center', gap:5,
    backgroundColor:'rgba(245,158,11,0.2)',
    borderWidth:1, borderColor:'rgba(245,158,11,0.4)',
    borderRadius:RADIUS.full, paddingHorizontal:SPACE.md, paddingVertical:5,
  },
  keynoteBadgeText:{ fontSize:10, fontWeight:FONT.w8, color:'#fde68a', letterSpacing:1.2 },

  heroAvatarWrap:{
    alignSelf:'center',
    borderRadius:36,
    borderWidth:3, borderColor:'rgba(255,255,255,0.2)',
    marginBottom:SPACE.xl,
    ...Platform.select({
      ios:{ shadowColor:'#000', shadowOffset:{width:0,height:12}, shadowOpacity:0.4, shadowRadius:20 },
      android:{ elevation:8 },
    }),
  },
  heroAvatarImg:{ width:120, height:120, borderRadius:33 },
  heroAvatarGrad:{ width:120, height:120, borderRadius:33, alignItems:'center', justifyContent:'center' },
  heroAvatarInitials:{ fontSize:44, fontWeight:FONT.w9, color:'#fff' },

  heroInfo:{ paddingHorizontal:PAD, alignItems:'center', marginBottom:SPACE.lg },
  heroName:{ fontSize:28, fontWeight:FONT.w9, color:'#fff', textAlign:'center', letterSpacing:-0.5, marginBottom:6 },
  heroDesig:{ fontSize:FONT.sm, color:'rgba(255,255,255,0.65)', textAlign:'center', lineHeight:20, marginBottom:SPACE.sm },
  heroInstRow:{ flexDirection:'row', alignItems:'center', gap:5, marginTop:4 },
  heroInst:{ fontSize:12, color:'rgba(255,255,255,0.45)', flex:1, textAlign:'center' },

  heroStats:{ flexDirection:'row', justifyContent:'center', gap:SPACE.md, paddingHorizontal:PAD },
  heroStatPill:{
    flexDirection:'row', alignItems:'center', gap:6,
    backgroundColor:'rgba(255,255,255,0.1)',
    borderWidth:1, borderColor:'rgba(255,255,255,0.15)',
    borderRadius:RADIUS.full, paddingHorizontal:SPACE.md, paddingVertical:7,
  },
  heroStatText:{ fontSize:11, fontWeight:FONT.w6, color:'rgba(255,255,255,0.7)' },

  /* Content */
  content:{ padding:PAD, marginTop:-SPACE.xl, gap:SPACE.md },

  card:{
    backgroundColor:'#fff', borderRadius:24,
    padding:SPACE.xl,
    ...Platform.select({
      ios:{ shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:12 },
      android:{ elevation:0, borderWidth:1, borderColor:COLORS.borderLight },
    }),
  },
  cardTitleRow:{ flexDirection:'row', alignItems:'center', gap:SPACE.md, marginBottom:SPACE.lg },
  cardIcon:{ width:32, height:32, borderRadius:10, alignItems:'center', justifyContent:'center' },
  cardTitle:{ fontSize:FONT.md, fontWeight:FONT.w8, color:COLORS.text, flex:1 },

  bioText:{ fontSize:FONT.sm, color:COLORS.textSec, lineHeight:24 },

  /* Talks */
  talkCountBadge:{
    backgroundColor:COLORS.brandLight, borderRadius:RADIUS.full,
    paddingHorizontal:SPACE.sm, paddingVertical:2, minWidth:22, alignItems:'center',
  },
  talkCountText:{ fontSize:11, fontWeight:FONT.w8, color:COLORS.brand },

  talkCard:{
    borderRadius:16, padding:SPACE.lg, marginBottom:SPACE.md,
    borderWidth:1, borderColor:COLORS.borderLight, overflow:'hidden',
  },
  talkHeader:{ flexDirection:'row', gap:SPACE.md, marginBottom:SPACE.sm },
  talkNumWrap:{
    width:32, height:32, borderRadius:10,
    backgroundColor:COLORS.brandLight,
    alignItems:'center', justifyContent:'center', flexShrink:0,
  },
  talkNum:{ fontSize:11, fontWeight:FONT.w9, color:COLORS.brand },
  trackBadge:{
    backgroundColor:COLORS.brandLight, alignSelf:'flex-start',
    borderRadius:6, paddingHorizontal:8, paddingVertical:2, marginBottom:5,
  },
  trackBadgeText:{ fontSize:9, fontWeight:FONT.w8, color:COLORS.brand, letterSpacing:0.5, textTransform:'uppercase' },
  talkTitle:{ fontSize:FONT.sm, fontWeight:FONT.w7, color:COLORS.text, lineHeight:20 },
  talkMeta:{ flexDirection:'row', gap:SPACE.md, marginBottom:SPACE.sm },
  talkMetaItem:{ flexDirection:'row', alignItems:'center', gap:4 },
  talkMetaText:{ fontSize:11, color:COLORS.textTer },
  talkAbstract:{ fontSize:FONT.xs, color:COLORS.textSec, lineHeight:18, marginTop:SPACE.sm },

  /* InfoRow */
  infoRow:{
    flexDirection:'row', alignItems:'center', gap:SPACE.md,
    paddingVertical:SPACE.md,
    borderBottomWidth:1, borderBottomColor:COLORS.borderLight,
  },
  infoIcon:{ width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  infoLabel:{ fontSize:10, fontWeight:FONT.w7, color:COLORS.textTer, letterSpacing:0.5, textTransform:'uppercase' },
  infoValue:{ fontSize:FONT.sm, color:COLORS.text, marginTop:2, fontWeight:FONT.w6 },

  /* Social */
  socialGrid:{ flexDirection:'row', flexWrap:'wrap', gap:SPACE.sm },
  socialBtn:{
    flexDirection:'row', alignItems:'center', gap:6,
    paddingHorizontal:SPACE.md, paddingVertical:SPACE.sm,
    borderRadius:RADIUS.md, borderWidth:1,
  },
  socialLabel:{ fontSize:FONT.xs, fontWeight:FONT.w7 },
});
