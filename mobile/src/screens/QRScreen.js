import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW } from '../theme';
import { Card, Badge, Divider, GradientAvatar, FadeIn } from '../components';

export default function QRScreen({ user }) {
  const sc = useRef(new Animated.Value(0.85)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(sc, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={['#0333b6', '#0448c8']} style={s.header}>
        <Text style={s.hTitle}>My QR Code</Text>
        <Text style={s.hSub}>Show at entry points and check-in desks</Text>
      </LinearGradient>
      <View style={{ backgroundColor: '#0448c8', height: 22 }}><View style={s.curve} /></View>

      <View style={s.body}>
        <Animated.View style={{ transform: [{ scale: sc }], opacity: op }}>
          <Card style={s.card} shadow="lg">
            <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.strip}>
              <Text style={s.stripText}>ETD 2026  ·  IIT Delhi</Text>
            </LinearGradient>
            <View style={s.qrBox}><Ionicons name="qr-code" size={140} color={COLORS.text} /></View>
            <View style={s.userRow}>
              <GradientAvatar name={user.first_name || user.email} size={52} radius={16} />
              <View style={{ marginLeft: SPACE.md, flex: 1 }}>
                <Text style={s.uName}>{user.first_name} {user.last_name}</Text>
                <Text style={s.uEmail}>{user.email}</Text>
                <Badge label={(user.role || 'participant').replace('_', ' ').toUpperCase()} color={COLORS.brand} bg={COLORS.bgCard} style={{ marginTop: SPACE.xs }} />
              </View>
            </View>
            <Divider style={{ marginVertical: SPACE.lg }} />
            <View style={s.regRow}>
              <View style={s.regItem}><Text style={s.regL}>Registration ID</Text><Text style={s.regV}>{user.registration_id || 'ETD-2026-0001'}</Text></View>
              <View style={s.regSep} />
              <View style={s.regItem}><Text style={s.regL}>Conference</Text><Text style={s.regV}>ETD 2026</Text></View>
            </View>
            <Divider style={{ marginVertical: SPACE.lg }} />
            <View style={s.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.success} style={{ marginRight: SPACE.xs }} />
              <Text style={s.infoText}>Verified attendee  ·  Valid for all 3 days</Text>
            </View>
          </Card>
        </Animated.View>
        <FadeIn delay={300}>
          <TouchableOpacity style={s.saveBtn} activeOpacity={0.78}>
            <Ionicons name="download-outline" size={18} color={COLORS.brand} style={{ marginRight: SPACE.sm }} />
            <Text style={s.saveBtnText}>Save to Photos</Text>
          </TouchableOpacity>
        </FadeIn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'ios' ? 58 : 46, paddingBottom: SPACE.lg, paddingHorizontal: SPACE.xl },
  hTitle: { fontSize: FONT.xl, fontWeight: FONT.w8, color: COLORS.textInverse },
  hSub: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  curve: { flex: 1, backgroundColor: COLORS.bg, borderTopLeftRadius: RADIUS.xxxl, borderTopRightRadius: RADIUS.xxxl },
  body: { flex: 1, paddingHorizontal: SPACE.xl, paddingTop: SPACE.lg, alignItems: 'center' },
  card: { width: '100%', overflow: 'hidden' },
  strip: { paddingVertical: 10, paddingHorizontal: SPACE.lg, alignItems: 'center' },
  stripText: { fontSize: FONT.xs, fontWeight: FONT.w7, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  qrBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACE.xxl },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.lg, paddingBottom: SPACE.md },
  uName: { fontSize: FONT.md, fontWeight: FONT.w7, color: COLORS.text },
  uEmail: { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2 },
  regRow: { flexDirection: 'row', paddingHorizontal: SPACE.lg },
  regItem: { flex: 1, alignItems: 'center' },
  regSep: { width: 1, backgroundColor: COLORS.borderLight, marginVertical: SPACE.xs },
  regL: { fontSize: FONT.xs, color: COLORS.textTer, marginBottom: 4 },
  regV: { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE.lg, paddingBottom: SPACE.lg },
  infoText: { fontSize: FONT.xs, color: COLORS.textTer },
  saveBtn: { flexDirection: 'row', alignItems: 'center', marginTop: SPACE.lg, paddingVertical: SPACE.md, paddingHorizontal: SPACE.xxl, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.brand, backgroundColor: COLORS.surface },
  saveBtnText: { fontSize: FONT.sm, fontWeight: FONT.w6, color: COLORS.brand },
});
