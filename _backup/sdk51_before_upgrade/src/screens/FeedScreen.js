import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW } from '../theme';
import { Avatar, FadeIn } from '../components';

const ROLE_STYLE = {
  Organizer: { color: COLORS.brand,   bg: COLORS.brandLight   },
  Speaker:   { color: COLORS.purple,  bg: COLORS.purpleLight  },
  System:    { color: COLORS.success, bg: COLORS.successLight },
  Attendee:  { color: COLORS.teal,    bg: COLORS.tealLight    },
};

const POSTS = [
  { id: 1, author: 'Organizing Team', role: 'Organizer', time: '10m ago', pinned: true,  text: 'Welcome to ETD 2026 at IIT Delhi! We are thrilled to have researchers from across the globe join us for three transformative days.', likes: 24, comments: 8  },
  { id: 2, author: 'Prof. R. Johnson', role: 'Speaker',  time: '28m ago', pinned: false, text: 'Excited for the keynote on AI in Research. See you all in Hall A at 10:30 AM!', likes: 17, comments: 5 },
  { id: 3, author: 'Event Updates',    role: 'System',   time: '1h ago',  pinned: false, text: 'Lunch at 13:00 in the Cafeteria. Please have your conference QR ready at entry.', likes: 9, comments: 2 },
  { id: 4, author: 'Dr. Priya Sharma', role: 'Attendee', time: '2h ago',  pinned: false, text: 'The poster session was incredible! So many innovative ETD projects. Congrats to all presenters.', likes: 31, comments: 11 },
];

function PostCard({ post, delay }) {
  const [liked, setLiked] = useState(false);
  const m = ROLE_STYLE[post.role] || ROLE_STYLE.Attendee;
  return (
    <FadeIn delay={delay}>
      <View style={s.card}>
        {post.pinned && (
          <View style={s.pinRow}>
            <Ionicons name="pin" size={11} color={COLORS.accent} />
            <Text style={s.pinText}>PINNED</Text>
          </View>
        )}
        <View style={s.authorRow}>
          <Avatar name={post.author} size={44} radius={14} bg={m.bg} textColor={m.color} />
          <View style={{ flex: 1, marginLeft: SPACE.md }}>
            <Text style={s.authorName}>{post.author}</Text>
            <View style={s.authorMeta}>
              <View style={[s.rolePill, { backgroundColor: m.bg }]}>
                <Text style={[s.rolePillText, { color: m.color }]}>{post.role.toUpperCase()}</Text>
              </View>
              <Text style={s.time}>{post.time}</Text>
            </View>
          </View>
          <TouchableOpacity><Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textTer} /></TouchableOpacity>
        </View>
        <Text style={s.postText}>{post.text}</Text>
        <View style={s.divider} />
        <View style={s.actions}>
          <TouchableOpacity style={s.actBtn} onPress={() => setLiked(!liked)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? COLORS.rose : COLORS.textTer} />
            <Text style={[s.actText, liked && { color: COLORS.rose }]}>{post.likes + (liked ? 1 : 0)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actBtn}>
            <Ionicons name="chatbubble-outline" size={15} color={COLORS.textTer} />
            <Text style={s.actText}>{post.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actBtn}>
            <Ionicons name="share-outline" size={16} color={COLORS.textTer} />
            <Text style={s.actText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </FadeIn>
  );
}

export default function FeedScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f9' }}>
      <View style={s.header}>
        <Text style={s.title}>Feed</Text>
        <Text style={s.sub}>Conference announcements & updates</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACE.xl }} showsVerticalScrollIndicator={false}>
        {POSTS.map((p, i) => <PostCard key={p.id} post={p} delay={i * 70} />)}
        <View style={{ height: 110 }} />
      </ScrollView>
      <TouchableOpacity style={s.fab} activeOpacity={0.82}>
        <LinearGradient colors={[COLORS.accent, COLORS.accentDark]} style={s.fabG}>
          <Ionicons name="create-outline" size={22} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 58 : 46,
    paddingBottom: SPACE.lg,
    paddingHorizontal: SPACE.xl,
    backgroundColor: '#f0f4f9',
  },
  title: { fontSize: 28, fontWeight: FONT.w9, color: COLORS.brand, letterSpacing: -0.5 },
  sub: { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 3 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 24, overflow: 'hidden',
    marginBottom: SPACE.md, padding: SPACE.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    ...Platform.select({
      ios: { shadowColor: '#002182', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 0 },
    }),
  },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, marginBottom: SPACE.sm },
  pinText: { fontSize: 10, fontWeight: FONT.w8, color: COLORS.accent, letterSpacing: 0.5 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE.md },
  authorName: { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.text },
  authorMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginTop: 4 },
  rolePill: { paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  rolePillText: { fontSize: 9, fontWeight: FONT.w8, letterSpacing: 0.5 },
  time: { fontSize: FONT.xs, color: COLORS.textTer },
  postText: { fontSize: FONT.sm, color: COLORS.textSec, lineHeight: 22 },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: SPACE.md },
  actions: { flexDirection: 'row', gap: SPACE.xl },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  actText: { fontSize: FONT.xs, color: COLORS.textTer, fontWeight: FONT.w5 },
  fab: { position: 'absolute', bottom: 90, right: SPACE.xl, borderRadius: RADIUS.full, ...SHADOW.accent },
  fabG: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
