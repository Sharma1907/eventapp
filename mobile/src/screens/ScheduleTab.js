import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW } from '../theme';
import { Card, Badge, FadeIn, IconBox } from '../components';

const DAYS = ['Day 1', 'Day 2', 'Day 3'];
const TYPE = {
  ceremony: { icon: 'star-outline', color: COLORS.brand, bg: COLORS.brandLight, label: 'Ceremony' },
  keynote: { icon: 'mic-outline', color: COLORS.purple, bg: COLORS.purpleLight, label: 'Keynote' },
  break: { icon: 'cafe-outline', color: COLORS.success, bg: COLORS.successLight, label: 'Break' },
  workshop: { icon: 'construct-outline', color: COLORS.accent, bg: COLORS.accentLight, label: 'Workshop' },
  paper: { icon: 'document-outline', color: COLORS.teal, bg: COLORS.tealLight, label: 'Paper' },
  poster: { icon: 'images-outline', color: COLORS.rose, bg: COLORS.roseLight, label: 'Poster' },
};

const SESSIONS = [
  [
    { time: '09:00', end: '10:00', title: 'Opening Ceremony', room: 'Hall A', speaker: 'Prof. M. Balakrishnan', type: 'ceremony' },
    { time: '10:30', end: '11:30', title: 'Keynote: AI in Research', room: 'Hall A', speaker: 'Prof. R. Johnson', type: 'keynote' },
    { time: '13:00', end: '14:00', title: 'Lunch Break', room: 'Cafeteria', speaker: '', type: 'break' },
    { time: '14:30', end: '16:00', title: 'Workshop: Data Science', room: 'Room 201', speaker: 'Dr. S. Williams', type: 'workshop' },
  ],
  [
    { time: '09:30', end: '10:30', title: 'Keynote: Quantum Computing', room: 'Hall A', speaker: 'Prof. A. Kumar', type: 'keynote' },
    { time: '11:00', end: '12:30', title: 'Paper Presentations', room: 'Room 201', speaker: 'Multiple Authors', type: 'paper' },
    { time: '14:00', end: '16:00', title: 'Poster Session', room: 'Exhibition', speaker: '', type: 'poster' },
  ],
  [
    { time: '09:30', end: '11:00', title: 'Workshop: ML Pipelines', room: 'Lab 1', speaker: 'Dr. P. Sharma', type: 'workshop' },
    { time: '14:00', end: '15:00', title: 'Awards Ceremony', room: 'Hall A', speaker: '', type: 'ceremony' },
    { time: '15:30', end: '16:30', title: 'Closing Session', room: 'Hall A', speaker: 'Prof. M. Balakrishnan', type: 'ceremony' },
  ],
];

export default function ScheduleTab() {
  const [day, setDay] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={['#0333b6', '#0448c8']} style={st.header}>
        <View style={st.inner}><Text style={st.title}>Schedule</Text><Text style={st.sub}>ETD 2026  ·  3 Days</Text></View>
        <View style={st.tabs}>
          {DAYS.map((d, i) => (
            <TouchableOpacity key={i} style={[st.tab, day === i && st.tabA]} onPress={() => setDay(i)} activeOpacity={0.75}>
              <Text style={[st.tabT, day === i && st.tabTA]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
      <View style={{ backgroundColor: '#0448c8', height: 22 }}><View style={st.curve} /></View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACE.xl, paddingTop: SPACE.lg }}>
        {SESSIONS[day].map((s, i) => {
          const m = TYPE[s.type] || TYPE.ceremony;
          return (
            <FadeIn key={i} delay={i * 60}>
              <Card style={st.card} shadow="sm" onPress={() => {}}>
                <IconBox name={m.icon} size={20} color={m.color} bg={m.bg} boxSize={44} radius={RADIUS.md} style={{ marginRight: SPACE.md }} />
                <View style={{ flex: 1 }}>
                  <View style={st.topRow}><Text style={[st.time, { color: m.color }]}>{s.time} – {s.end}</Text><Badge label={m.label.toUpperCase()} color={m.color} bg={m.bg} /></View>
                  <Text style={st.sTitle}>{s.title}</Text>
                  <View style={st.meta}>
                    <Ionicons name="location-outline" size={11} color={COLORS.textTer} style={{ marginRight: 3 }} /><Text style={st.metaT}>{s.room}</Text>
                    {!!s.speaker && <><View style={st.dot} /><Ionicons name="person-outline" size={11} color={COLORS.textTer} style={{ marginRight: 3 }} /><Text style={st.metaT} numberOfLines={1}>{s.speaker}</Text></>}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.border} style={{ marginLeft: SPACE.sm }} />
              </Card>
            </FadeIn>
          );
        })}
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 46, paddingBottom: SPACE.lg, paddingHorizontal: SPACE.xl },
  inner: { marginBottom: SPACE.lg },
  title: { fontSize: FONT.xl, fontWeight: FONT.w8, color: COLORS.textInverse },
  sub: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: RADIUS.md, padding: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.sm, alignItems: 'center' },
  tabA: { backgroundColor: COLORS.textInverse },
  tabT: { fontSize: FONT.sm, fontWeight: FONT.w6, color: 'rgba(255,255,255,0.60)' },
  tabTA: { color: COLORS.brand },
  curve: { flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: RADIUS.xxxl, borderTopRightRadius: RADIUS.xxxl },
  card: { flexDirection: 'row', alignItems: 'center', padding: SPACE.md, marginBottom: SPACE.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  time: { fontSize: FONT.xs, fontWeight: FONT.w7 },
  sTitle: { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.text, marginBottom: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaT: { fontSize: FONT.xs, color: COLORS.textTer },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.textMuted, marginHorizontal: SPACE.xs },
});
