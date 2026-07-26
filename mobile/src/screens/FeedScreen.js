import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW } from '../theme';
import { Card, Badge, Avatar, Divider, FadeIn } from '../components';

const RM = {
  Organizer: { color: COLORS.brand, bg: COLORS.brandLight },
  Speaker: { color: COLORS.purple, bg: COLORS.purpleLight },
  System: { color: COLORS.success, bg: COLORS.successLight },
  Attendee: { color: COLORS.teal, bg: COLORS.tealLight },
};

const POSTS = [
  { id: 1, author: 'Organizing Team', role: 'Organizer', time: '10m ago', pinned: true, text: 'Welcome to ETD 2026 at IIT Delhi! We are thrilled to have researchers and scholars from across the globe join us for three transformative days.', likes: 24, comments: 8 },
  { id: 2, author: 'Prof. R. Johnson', role: 'Speaker', time: '28m ago', pinned: false, text: 'Excited for the keynote on AI in Research. See you all in Hall A at 10:30 AM!', likes: 17, comments: 5 },
  { id: 3, author: 'Event Updates', role: 'System', time: '1h ago', pinned: false, text: 'Lunch at 13:00 in the Cafeteria. Please have your conference QR ready at entry.', likes: 9, comments: 2 },
  { id: 4, author: 'Dr. Priya Sharma', role: 'Attendee', time: '2h ago', pinned: false, text: 'The poster session was incredible! So many innovative ETD projects. Congrats to all presenters.', likes: 31, comments: 11 },
];

function PostCard({ post, delay }) {
  const [liked, setLiked] = useState(false);
  const m = RM[post.role] || RM.Attendee;
  return (
    <FadeIn delay={delay}>
      <Card style={st.postCard} shadow="sm">
        {post.pinned && <View style={st.pinRow}><Ionicons name="pin" size={11} color={COLORS.accent} style={{ marginRight: 4 }} /><Text style={st.pinText}>PINNED</Text></View>}
        <View style={st.authorRow}>
          <Avatar name={post.author} size={42} radius={14} bg={m.bg} textColor={m.color} />
          <View style={{ flex: 1, marginLeft: SPACE.md }}>
            <Text style={st.authorName}>{post.author}</Text>
            <View style={st.authorMeta}><Badge label={post.role.toUpperCase()} color={m.color} bg={m.bg} /><Text style={st.time}>{post.time}</Text></View>
          </View>
          <TouchableOpacity><Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textTer} /></TouchableOpacity>
        </View>
        <Text style={st.postText}>{post.text}</Text>
        <Divider style={{ marginVertical: SPACE.md }} />
        <View style={st.actions}>
          <TouchableOpacity style={st.actBtn} onPress={() => setLiked(!liked)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? COLORS.rose : COLORS.textTer} />
            <Text style={[st.actText, liked && { color: COLORS.rose }]}>{post.likes + (liked ? 1 : 0)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.actBtn}><Ionicons name="chatbubble-outline" size={15} color={COLORS.textTer} /><Text style={st.actText}>{post.comments}</Text></TouchableOpacity>
          <TouchableOpacity style={st.actBtn}><Ionicons name="share-outline" size={16} color={COLORS.textTer} /><Text style={st.actText}>Share</Text></TouchableOpacity>
        </View>
      </Card>
    </FadeIn>
  );
}

export default function FeedScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={['#0333b6', '#0448c8']} style={st.header}>
        <Text style={st.hTitle}>Feed</Text>
        <Text style={st.hSub}>Conference announcements & updates</Text>
      </LinearGradient>
      <View style={{ backgroundColor: '#0448c8', height: 22 }}><View style={st.curve} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACE.xl, paddingTop: SPACE.lg }} showsVerticalScrollIndicator={false}>
        {POSTS.map((p, i) => <PostCard key={p.id} post={p} delay={i * 70} />)}
        <View style={{ height: 110 }} />
      </ScrollView>
      <TouchableOpacity style={st.fab} activeOpacity={0.82}>
        <LinearGradient colors={[COLORS.accent, COLORS.accentDark]} style={st.fabG}>
          <Ionicons name="create-outline" size={22} color={COLORS.textInverse} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 46, paddingBottom: SPACE.lg, paddingHorizontal: SPACE.xl },
  hTitle: { fontSize: FONT.xl, fontWeight: FONT.w8, color: COLORS.textInverse },
  hSub: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  curve: { flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: RADIUS.xxxl, borderTopRightRadius: RADIUS.xxxl },
  postCard: { padding: SPACE.lg, marginBottom: SPACE.md },
  pinRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE.sm },
  pinText: { fontSize: FONT.xs, fontWeight: FONT.w7, color: COLORS.accent, letterSpacing: 0.5 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACE.md },
  authorName: { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.text },
  authorMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginTop: 4 },
  time: { fontSize: FONT.xs, color: COLORS.textTer },
  postText: { fontSize: FONT.sm, color: COLORS.textSec, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: SPACE.xl },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  actText: { fontSize: FONT.xs, color: COLORS.textTer, fontWeight: FONT.w5 },
  fab: { position: 'absolute', bottom: 90, right: SPACE.xl, borderRadius: RADIUS.full, ...SHADOW.accent },
  fabG: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
