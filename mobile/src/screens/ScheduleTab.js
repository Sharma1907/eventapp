import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW } from '../theme';
import { FadeIn } from '../components';

const DAYS = ['Day 1', 'Day 2', 'Day 3'];

const TYPE = {
  ceremony: { icon: 'star-outline',     color: COLORS.brand,   bg: COLORS.brandLight   },
  keynote:  { icon: 'mic-outline',       color: COLORS.purple,  bg: COLORS.purpleLight  },
  break:    { icon: 'cafe-outline',      color: COLORS.success, bg: COLORS.successLight },
  workshop: { icon: 'construct-outline', color: COLORS.accent,  bg: COLORS.accentLight  },
  paper:    { icon: 'document-outline',  color: COLORS.teal,    bg: COLORS.tealLight    },
  poster:   { icon: 'images-outline',    color: COLORS.rose,    bg: COLORS.roseLight    },
};

const SESSIONS = [
  [
    { time: '09:00', end: '10:00', title: 'Opening Ceremony',      room: 'Hall A',    speaker: 'Prof. M. Balakrishnan', type: 'ceremony' },
    { time: '10:30', end: '11:30', title: 'Keynote: AI in Research', room: 'Hall A',   speaker: 'Prof. R. Johnson',      type: 'keynote'  },
    { time: '13:00', end: '14:00', title: 'Lunch Break',            room: 'Cafeteria', speaker: '',                      type: 'break'    },
    { time: '14:30', end: '16:00', title: 'Workshop: Data Science', room: 'Room 201',  speaker: 'Dr. S. Williams',       type: 'workshop' },
  ],
  [
    { time: '09:30', end: '10:30', title: 'Keynote: Quantum Computing', room: 'Hall A',    speaker: 'Prof. A. Kumar',    type: 'keynote' },
    { time: '11:00', end: '12:30', title: 'Paper Presentations',        room: 'Room 201',  speaker: 'Multiple Authors',  type: 'paper'   },
    { time: '14:00', end: '16:00', title: 'Poster Session',             room: 'Exhibition', speaker: '',                 type: 'poster'  },
  ],
  [
    { time: '09:30', end: '11:00', title: 'Workshop: ML Pipelines', room: 'Lab 1',  speaker: 'Dr. P. Sharma',       type: 'workshop' },
    { time: '14:00', end: '15:00', title: 'Awards Ceremony',        room: 'Hall A', speaker: '',                    type: 'ceremony' },
    { time: '15:30', end: '16:30', title: 'Closing Session',        room: 'Hall A', speaker: 'Prof. M. Balakrishnan', type: 'ceremony' },
  ],
];

export default function ScheduleTab() {
  const [day, setDay] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: '#f0f4f9' }}>
      {/* header */}
      <View style={s.header}>
        <Text style={s.title}>Schedule</Text>
        <Text style={s.sub}>ETD 2026  ·  3 Days</Text>
        {/* day tabs */}
        <View style={s.tabs}>
          {DAYS.map((d, i) => (
            <TouchableOpacity key={i} style={[s.tab, day === i && s.tabA]} onPress={() => setDay(i)} activeOpacity={0.75}>
              <Text style={[s.tabT, day === i && s.tabTA]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACE.xl }} showsVerticalScrollIndicator={false}>
        {SESSIONS[day].map((sess, i) => {
          const m = TYPE[sess.type] || TYPE.ceremony;
          return (
            <FadeIn key={i} delay={i * 60}>
              <TouchableOpacity style={s.card} activeOpacity={0.78}>
                <View style={[s.typeBar, { backgroundColor: m.color }]} />
                <View style={[s.iconWrap, { backgroundColor: m.bg }]}>
                  <Ionicons name={m.icon} size={20} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.topRow}>
                    <Text style={[s.time, { color: m.color }]}>{sess.time} – {sess.end}</Text>
                    <View style={[s.typeBadge, { backgroundColor: m.bg }]}>
                      <Text style={[s.typeBadgeText, { color: m.color }]}>{sess.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={s.sessionTitle}>{sess.title}</Text>
                  <View style={s.metaRow}>
                    <Ionicons name="location-outline" size={11} color={COLORS.textTer} />
                    <Text style={s.metaText}>{sess.room}</Text>
                    {!!sess.speaker && <>
                      <View style={s.dot} />
                      <Ionicons name="person-outline" size={11} color={COLORS.textTer} />
                      <Text style={s.metaText} numberOfLines={1}>{sess.speaker}</Text>
                    </>}
                  </View>
                </View>
              </TouchableOpacity>
            </FadeIn>
          );
        })}
        <View style={{ height: 110 }} />
      </ScrollView>
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
  sub: { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 3, marginBottom: SPACE.lg },
  tabs: {
    flexDirection: 'row', gap: SPACE.sm,
  },
  tab: {
    flex: 1, paddingVertical: SPACE.sm, borderRadius: RADIUS.lg,
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  tabA: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  tabT: { fontSize: FONT.sm, fontWeight: FONT.w6, color: COLORS.textSec },
  tabTA: { color: '#fff' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 20, overflow: 'hidden',
    marginBottom: SPACE.md, padding: SPACE.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    ...Platform.select({
      ios: { shadowColor: '#002182', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 0 },
    }),
  },
  typeBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  iconWrap: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACE.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  time: { fontSize: FONT.xs, fontWeight: FONT.w7 },
  typeBadge: { paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  typeBadgeText: { fontSize: 9, fontWeight: FONT.w8, letterSpacing: 0.5 },
  sessionTitle: { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.text, marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flexWrap: 'wrap' },
  metaText: { fontSize: FONT.xs, color: COLORS.textTer },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.textMuted, marginHorizontal: 3 },
});
