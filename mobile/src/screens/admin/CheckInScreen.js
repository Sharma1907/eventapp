import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, Alert,
  Image, Animated, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT, SPACE, RADIUS, API_URL, API_HEADERS } from '../../theme';
import { GradientAvatar } from '../../components';

function authHeaders(tokens) {
  return { ...API_HEADERS, Authorization: `Bearer ${tokens.access}` };
}

// ── Top-level tabs: scan | history ────────────────────────────────────────
function TopTabs({ tab, setTab }) {
  const tabs = [
    { key: 'checkin', label: 'Check In',   icon: 'person-done-outline' },
    { key: 'meal',    label: 'Meal Scan',   icon: 'restaurant-outline'  },
    { key: 'history', label: 'History',     icon: 'list-outline'        },
  ];
  return (
    <View style={tt.wrap}>
      {tabs.map(t => (
        <TouchableOpacity
          key={t.key}
          style={[tt.tab, tab === t.key && tt.tabOn]}
          onPress={() => setTab(t.key)}
          activeOpacity={0.8}
        >
          <Ionicons name={t.icon} size={15} color={tab === t.key ? '#fff' : COLORS.textSec} />
          <Text style={[tt.txt, tab === t.key && tt.txtOn]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const tt = StyleSheet.create({
  wrap:  { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 4, marginBottom: SPACE.xl, borderWidth: 1, borderColor: COLORS.border },
  tab:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACE.sm + 2, borderRadius: RADIUS.md },
  tabOn: { backgroundColor: COLORS.brand },
  txt:   { fontSize: FONT.xs, fontWeight: FONT.w6, color: COLORS.textSec },
  txtOn: { color: '#fff' },
});

// ── QR Camera scanner modal ───────────────────────────────────────────────
function QRScannerModal({ visible, onScan, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => { if (visible) setScanned(false); }, [visible]);

  const handleBarcode = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onScan(data);
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={qr.header}>
          <TouchableOpacity onPress={onClose} style={qr.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={qr.headerTxt}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>
        {!permission?.granted ? (
          <View style={qr.permWrap}>
            <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.5)" />
            <Text style={qr.permTxt}>Camera permission required.</Text>
            <TouchableOpacity style={qr.permBtn} onPress={requestPermission}>
              <Text style={qr.permBtnTxt}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <CameraView
              style={{ flex: 1 }} facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcode}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View style={qr.overlay}>
              <View style={qr.frame}>
                {[qr.tl, qr.tr, qr.bl, qr.br].map((pos, i) => (
                  <View key={i} style={[qr.corner, pos]} />
                ))}
              </View>
              <Text style={qr.hint}>Point at the attendee's QR code</Text>
            </View>
            {scanned && (
              <View style={qr.scannedBanner}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '600' }}>Processing…</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}
const CORNER_SIZE = 24, CORNER_W = 3;
const qr = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 54 : 44, paddingHorizontal: SPACE.xl, paddingBottom: SPACE.md, backgroundColor: 'rgba(0,0,0,0.6)' },
  closeBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTxt:  { color: '#fff', fontSize: FONT.md, fontWeight: FONT.w7 },
  permWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACE.xxl, gap: SPACE.lg },
  permTxt:    { color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: FONT.sm },
  permBtn:    { backgroundColor: COLORS.brand, borderRadius: RADIUS.lg, paddingHorizontal: SPACE.xxl, paddingVertical: SPACE.md },
  permBtnTxt: { color: '#fff', fontWeight: FONT.w7, fontSize: FONT.sm },
  overlay:    { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame:      { width: 220, height: 220, position: 'relative' },
  corner:     { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#fff' },
  tl:         { top: 0,    left: 0,  borderTopWidth: CORNER_W,    borderLeftWidth:  CORNER_W },
  tr:         { top: 0,    right: 0, borderTopWidth: CORNER_W,    borderRightWidth: CORNER_W },
  bl:         { bottom: 0, left: 0,  borderBottomWidth: CORNER_W, borderLeftWidth:  CORNER_W },
  br:         { bottom: 0, right: 0, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W },
  hint:       { color: 'rgba(255,255,255,0.75)', marginTop: SPACE.xxl, fontSize: FONT.sm, textAlign: 'center' },
  scannedBanner: { position: 'absolute', bottom: 60, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: SPACE.xl, paddingVertical: SPACE.md, borderRadius: RADIUS.full },
});

// ── Full-screen scan result overlay (shown to user) ───────────────────────
function ScanOverlay({ visible, result, onClose }) {
  const scale   = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.7); opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !result) return null;

  const ok      = result.success;
  const already = result.already_in || result.already_used;
  const color   = ok ? COLORS.success : already ? COLORS.warning : COLORS.error;
  const icon    = ok ? 'checkmark-circle' : already ? 'information-circle' : 'close-circle';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[ov.bg, { opacity }]}>
        <Animated.View style={[ov.card, { transform: [{ scale }], borderColor: color }]}>
          {/* Big icon */}
          <View style={[ov.iconWrap, { backgroundColor: color + '18' }]}>
            <Ionicons name={icon} size={72} color={color} />
          </View>

          {/* Status text */}
          <Text style={[ov.status, { color }]}>
            {ok ? 'SUCCESS' : already ? 'ALREADY DONE' : 'NOT FOUND'}
          </Text>
          <Text style={ov.msg}>{result.message}</Text>

          {/* User info */}
          {result.user && (
            <View style={ov.userRow}>
              <GradientAvatar name={result.user.name || result.user.email} size={44} radius={14} />
              <View style={{ flex: 1 }}>
                <Text style={ov.uName}>{result.user.name}</Text>
                <Text style={ov.uSub}>{result.user.registration_id || result.user.email}</Text>
                {!!result.user.affiliation && (
                  <Text style={ov.uSub} numberOfLines={1}>{result.user.affiliation}</Text>
                )}
              </View>
            </View>
          )}

          {/* Points */}
          {ok && result.points_awarded > 0 && (
            <View style={ov.pointsPill}>
              <Ionicons name="star" size={14} color={COLORS.accent} />
              <Text style={ov.pointsTxt}>+{result.points_awarded} points awarded</Text>
            </View>
          )}

          <TouchableOpacity style={[ov.closeBtn, { backgroundColor: color }]} onPress={onClose}>
            <Text style={ov.closeTxt}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
const ov = StyleSheet.create({
  bg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACE.xl },
  card:       { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 28, padding: SPACE.xl, alignItems: 'center', borderWidth: 2,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24 }, android: { elevation: 12 } }) },
  iconWrap:   { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.lg },
  status:     { fontSize: FONT.xl, fontWeight: FONT.w9, letterSpacing: 1, marginBottom: SPACE.xs },
  msg:        { fontSize: FONT.sm, color: COLORS.textSec, textAlign: 'center', marginBottom: SPACE.lg, lineHeight: 20 },
  userRow:    { flexDirection: 'row', gap: SPACE.md, alignItems: 'center', width: '100%', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: SPACE.md, marginBottom: SPACE.lg },
  uName:      { fontSize: FONT.md, fontWeight: FONT.w7, color: COLORS.text },
  uSub:       { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2 },
  pointsPill: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, backgroundColor: COLORS.accentLight, paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs, borderRadius: RADIUS.full, marginBottom: SPACE.lg },
  pointsTxt:  { fontSize: FONT.xs, fontWeight: FONT.w7, color: COLORS.accentDark },
  closeBtn:   { width: '100%', height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  closeTxt:   { color: '#fff', fontSize: FONT.md, fontWeight: FONT.w7 },
});

// ── Kit badge ─────────────────────────────────────────────────────────────
function KitBadge({ status }) {
  const map = {
    received: { label: 'Kit Received', bg: COLORS.successLight, fg: COLORS.success, icon: 'checkmark-circle' },
    skipped:  { label: 'Kit Skipped',  bg: COLORS.warningLight, fg: COLORS.warning, icon: 'remove-circle'   },
    pending:  { label: 'Kit Pending',  bg: COLORS.borderLight,  fg: COLORS.textSec, icon: 'time-outline'    },
  };
  const c = map[status] || map.pending;
  return (
    <View style={[kb.wrap, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon} size={13} color={c.fg} />
      <Text style={[kb.txt, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}
const kb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACE.md, paddingVertical: 5, borderRadius: RADIUS.full },
  txt:  { fontSize: FONT.xs, fontWeight: FONT.w6 },
});

// ── Conference Kit confirmation (shown below scan result) ─────────────────
function KitConfirm({ checkinId, userName, tokens, onDone }) {
  const [loading, setLoading] = useState(false);

  const confirm = async (received) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/checkins/goodies/`, {
        method: 'POST', headers: authHeaders(tokens),
        body:   JSON.stringify({ checkin_id: checkinId, received }),
      });
      const data = await res.json();
      if (data.success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onDone(data.goodies_status);
      } else {
        Alert.alert('Error', data.message || 'Failed to update kit status');
      }
    } catch { Alert.alert('Error', 'Network error'); }
    setLoading(false);
  };

  return (
    <View style={kc.wrap}>
      <View style={kc.header}>
        <Ionicons name="gift-outline" size={18} color={COLORS.accent} />
        <Text style={kc.title}>Conference Kit for {userName}?</Text>
      </View>
      <View style={kc.btns}>
        <TouchableOpacity
          style={[kc.btn, { backgroundColor: COLORS.success }]}
          onPress={() => confirm(true)} disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="gift" size={15} color="#fff" /><Text style={kc.btnTxt}>Kit Given</Text></>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={[kc.btn, { backgroundColor: COLORS.textSec }]}
          onPress={() => confirm(false)} disabled={loading}
        >
          <Ionicons name="close" size={15} color="#fff" />
          <Text style={kc.btnTxt}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const kc = StyleSheet.create({
  wrap:   { backgroundColor: COLORS.accentLight, borderRadius: RADIUS.xl, padding: SPACE.lg, marginBottom: SPACE.lg, borderWidth: 1, borderColor: COLORS.accentMid },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.md },
  title:  { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.text, flex: 1 },
  btns:   { flexDirection: 'row', gap: SPACE.sm },
  btn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACE.md, borderRadius: RADIUS.lg },
  btnTxt: { color: '#fff', fontSize: FONT.sm, fontWeight: FONT.w7 },
});

// ── Stats bar ─────────────────────────────────────────────────────────────
function StatsBar({ stats, mode }) {
  if (!stats) return null;
  const items = mode === 'checkin'
    ? [
        { label: 'Checked In', val: stats.checked_in,                      color: COLORS.success },
        { label: 'Remaining',  val: (stats.total || 0) - (stats.checked_in || 0), color: COLORS.warning },
        { label: 'Total',      val: stats.total,                           color: COLORS.text    },
      ]
    : [
        { label: 'Passes Used',  val: stats.used,  color: COLORS.success },
        { label: 'Generated',    val: stats.total, color: COLORS.brand   },
      ];

  return (
    <View style={sb.wrap}>
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          <View style={sb.item}>
            <Text style={[sb.num, { color: it.color }]}>{it.val ?? '—'}</Text>
            <Text style={sb.lbl}>{it.label}</Text>
          </View>
          {i < items.length - 1 && <View style={sb.div} />}
        </React.Fragment>
      ))}
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACE.md, marginBottom: SPACE.xl, borderWidth: 1, borderColor: COLORS.border },
  item: { flex: 1, alignItems: 'center' },
  num:  { fontSize: FONT.xl, fontWeight: FONT.w8 },
  lbl:  { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2, textAlign: 'center' },
  div:  { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
});

// ── History list ──────────────────────────────────────────────────────────
function HistoryTab({ tokens }) {
  const [subTab, setSubTab]   = useState('checkin'); // 'checkin' | 'meal'
  const [items,  setItems]    = useState([]);
  const [loading,setLoading]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'checkin') {
        const res  = await fetch(`${API_URL}/checkins/list/`, { headers: authHeaders(tokens) });
        const data = await res.json();
        setItems(data.checkins || []);
      } else {
        const res  = await fetch(`${API_URL}/checkins/meal/list/`, { headers: authHeaders(tokens) });
        const data = await res.json();
        setItems(data.passes || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [subTab]);

  useEffect(() => { load(); }, [load]);

  const renderCheckin = ({ item }) => (
    <View style={hs.row}>
      <GradientAvatar name={item.user?.name || '?'} size={40} radius={12} />
      <View style={{ flex: 1 }}>
        <Text style={hs.name}>{item.user?.name}</Text>
        <Text style={hs.sub}>{item.user?.registration_id} · {item.scanned_by || 'System'}</Text>
        <Text style={hs.time}>{item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
      </View>
      <KitBadge status={item.goodies_status || 'pending'} />
    </View>
  );

  const renderMeal = ({ item }) => (
    <View style={hs.row}>
      <View style={hs.mealIcon}>
        <Text style={{ fontSize: 22 }}>🍽️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={hs.name}>{item.user?.name}</Text>
        <Text style={hs.sub}>{item.user?.registration_id}</Text>
        <Text style={hs.time}>{item.used_at ? new Date(item.used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not used'}</Text>
      </View>
      <View style={[hs.badge, { backgroundColor: item.used ? COLORS.successLight : COLORS.borderLight }]}>
        <Text style={{ fontSize: FONT.xs, fontWeight: FONT.w7, color: item.used ? COLORS.success : COLORS.textTer }}>
          {item.used ? 'Used' : 'Pending'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* sub tabs */}
      <View style={tt.wrap}>
        {[{ key: 'checkin', label: 'Check-Ins' }, { key: 'meal', label: 'Meal Passes' }].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[tt.tab, subTab === t.key && tt.tabOn]}
            onPress={() => setSubTab(t.key)}
          >
            <Text style={[tt.txt, subTab === t.key && tt.txtOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.brand} style={{ marginTop: SPACE.xxl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(_, i) => String(i)}
          renderItem={subTab === 'checkin' ? renderCheckin : renderMeal}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: SPACE.xxl, gap: SPACE.md }}>
              <Ionicons name="list-outline" size={36} color={COLORS.textTer} />
              <Text style={{ color: COLORS.textTer, fontSize: FONT.sm }}>No records yet</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshing={loading}
          onRefresh={load}
        />
      )}
    </View>
  );
}
const hs = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, padding: SPACE.md, backgroundColor: COLORS.surface, marginBottom: SPACE.xs, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  name:     { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.text },
  sub:      { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2 },
  time:     { fontSize: FONT.xs, color: COLORS.brand, marginTop: 2, fontWeight: FONT.w6 },
  mealIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.brandLight, alignItems: 'center', justifyContent: 'center' },
  badge:    { paddingHorizontal: SPACE.sm, paddingVertical: 4, borderRadius: RADIUS.full },
});

// ── Main screen ───────────────────────────────────────────────────────────
export default function CheckInScreen({ tokens, onBack }) {
  const [tab,        setTab]        = useState('checkin');
  const [regId,      setRegId]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [stats,      setStats]      = useState(null);
  const [camVisible, setCamVisible] = useState(false);
  const [showOverlay,setShowOverlay]= useState(false);
  const [kitCheckinId, setKitCheckinId] = useState(null);
  const [kitUserName,  setKitUserName]  = useState('');
  const [kitStatus,    setKitStatus]    = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (tab !== 'history') loadStats();
    setResult(null);
    setRegId('');
    setKitCheckinId(null);
    setKitStatus(null);
  }, [tab]);

  const loadStats = async () => {
    try {
      if (tab === 'checkin') {
        const [listRes, totalRes] = await Promise.all([
          fetch(`${API_URL}/checkins/list/`,             { headers: authHeaders(tokens) }),
          fetch(`${API_URL}/auth/users/?role=participant`, { headers: authHeaders(tokens) }),
        ]);
        const l = await listRes.json();
        const t = await totalRes.json();
        setStats({ checked_in: l.count || 0, total: t.total || 0 });
      } else if (tab === 'meal') {
        const res  = await fetch(`${API_URL}/checkins/meal/stats/`, { headers: authHeaders(tokens) });
        const data = await res.json();
        setStats({ used: data.used || 0, total: data.total || 0 });
      }
    } catch { /* silent */ }
  };

  const parseQR = (raw) => {
    try {
      const p = JSON.parse(raw);
      return { reg: p.reg || '', passId: p.pass_id || '', meal: p.meal || 'meal' };
    } catch {
      return { reg: raw, passId: '', meal: 'meal' };
    }
  };

  const handleQRScan = async (raw) => {
    setCamVisible(false);
    const { reg, passId, meal } = parseQR(raw);
    if (tab === 'checkin') { setRegId(reg); await doCheckin(reg); }
    else                   { await doMealScan({ reg, passId, meal }); }
  };

  const doCheckin = async (id) => {
    const rid = (id || regId).trim().toUpperCase();
    if (!rid) { Alert.alert('Required', 'Enter a Registration ID.'); return; }
    setLoading(true); setResult(null); setKitCheckinId(null); setKitStatus(null);
    try {
      const res  = await fetch(`${API_URL}/checkins/scan/`, {
        method: 'POST', headers: authHeaders(tokens),
        body:   JSON.stringify({ registration_id: rid }),
      });
      const data = await res.json();
      data.success
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setResult(data);
      setShowOverlay(true);
      if (data.success) {
        setStats(prev => prev ? { ...prev, checked_in: (prev.checked_in || 0) + 1 } : null);
        // Set up kit confirmation if new check-in
        if (data.checkin_id) {
          setKitCheckinId(data.checkin_id);
          setKitUserName(data.user?.name || rid);
          setKitStatus('pending');
        }
      }
    } catch (e) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  const doMealScan = async ({ reg, passId, meal }) => {
    setLoading(true); setResult(null);
    try {
      const body = passId
        ? { qr_data: JSON.stringify({ pass_id: passId, meal, reg }) }
        : { registration_id: reg.trim().toUpperCase(), meal_type: 'meal' };

      const res  = await fetch(`${API_URL}/checkins/meal/scan/`, {
        method: 'POST', headers: authHeaders(tokens),
        body:   JSON.stringify(body),
      });
      const data = await res.json();
      data.success
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setResult(data);
      setShowOverlay(true);
    } catch (e) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  const handleSubmit = () => {
    tab === 'checkin'
      ? doCheckin(regId)
      : doMealScan({ reg: regId, passId: '', meal: 'meal' });
  };

  const reset = () => {
    setResult(null); setRegId('');
    setKitCheckinId(null); setKitStatus(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Scan</Text>
          <Text style={s.sub}>Check-in &amp; Meal Scanner</Text>
        </View>
        <TouchableOpacity onPress={() => { loadStats(); reset(); }} style={s.iconBtn}>
          <Ionicons name="refresh" size={18} color={COLORS.brand} />
        </TouchableOpacity>
      </View>

      {/* Full-screen scan result overlay */}
      <ScanOverlay
        visible={showOverlay}
        result={result}
        onClose={() => setShowOverlay(false)}
      />

      <ScrollView
        contentContainerStyle={{ padding: SPACE.xl, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TopTabs tab={tab} setTab={setTab} />

        {tab === 'history' ? (
          <HistoryTab tokens={tokens} />
        ) : (
          <>
            <StatsBar stats={stats} mode={tab} />

            {/* Conference Kit confirmation — persists after overlay closes */}
            {tab === 'checkin' && kitCheckinId && kitStatus === 'pending' && (
              <KitConfirm
                checkinId={kitCheckinId}
                userName={kitUserName}
                tokens={tokens}
                onDone={(status) => setKitStatus(status)}
              />
            )}
            {tab === 'checkin' && kitStatus && kitStatus !== 'pending' && (
              <View style={[kc.wrap, { backgroundColor: COLORS.successLight, borderColor: COLORS.success + '40' }]}>
                <KitBadge status={kitStatus} />
              </View>
            )}

            {/* Input */}
            <Text style={s.sectionLabel}>
              {tab === 'checkin' ? 'REGISTRATION ID' : 'REG ID OR SCAN QR'}
            </Text>
            <View style={s.inputCard}>
              <View style={s.inputRow}>
                <Ionicons name="id-card-outline" size={18} color={COLORS.textTer} />
                <TextInput
                  ref={inputRef}
                  style={s.input}
                  value={regId}
                  onChangeText={v => setRegId(v.toUpperCase())}
                  placeholder="e.g. ETD-2026-R-001"
                  placeholderTextColor={COLORS.textTer}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleSubmit}
                />
                {!!regId && (
                  <TouchableOpacity onPress={() => setRegId('')}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textTer} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: SPACE.sm }}>
                <TouchableOpacity style={s.cameraBtn} onPress={() => setCamVisible(true)} activeOpacity={0.8}>
                  <Ionicons name="qr-code-outline" size={18} color={COLORS.brand} />
                  <Text style={s.cameraBtnTxt}>Scan QR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.scanBtn, loading && { opacity: 0.7 }, { flex: 1 }]}
                  onPress={handleSubmit} disabled={loading} activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name={tab === 'checkin' ? 'checkmark-circle' : 'restaurant'} size={18} color="#fff" />
                        <Text style={s.scanBtnTxt}>{tab === 'checkin' ? 'Check In' : 'Verify Pass'}</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Next button after scan */}
            {result && (
              <TouchableOpacity style={s.nextBtn} onPress={reset} activeOpacity={0.8}>
                <Ionicons name="arrow-forward-circle" size={18} color={COLORS.brand} />
                <Text style={s.nextBtnTxt}>Next Scan</Text>
              </TouchableOpacity>
            )}

            {!result && (
              <View style={s.tip}>
                <Ionicons name="bulb-outline" size={15} color={COLORS.textTer} />
                <Text style={s.tipTxt}>
                  {tab === 'checkin'
                    ? 'Tap "Scan QR" to use camera, or type the registration ID manually.'
                    : 'Scan the attendee\'s meal pass QR, or enter their registration ID.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <QRScannerModal visible={camVisible} onScan={handleQRScan} onClose={() => setCamVisible(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 54 : 44, paddingBottom: SPACE.md, paddingHorizontal: SPACE.xl, backgroundColor: COLORS.bg, gap: SPACE.md },
  backBtn:      { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  iconBtn:      { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.brandLight, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: FONT.lg, fontWeight: FONT.w8, color: COLORS.text },
  sub:          { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: FONT.w8, color: COLORS.textTer, letterSpacing: 1.5, marginBottom: SPACE.sm, marginLeft: 4 },
  inputCard:    { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACE.xl, gap: SPACE.md },
  inputRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2, borderWidth: 1, borderColor: COLORS.border },
  input:        { flex: 1, fontSize: FONT.md, color: COLORS.text, fontWeight: FONT.w6 },
  cameraBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, paddingHorizontal: SPACE.lg, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.brand, backgroundColor: COLORS.brandLight },
  cameraBtnTxt: { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.brand },
  scanBtn:      { backgroundColor: COLORS.brand, borderRadius: RADIUS.lg, paddingVertical: SPACE.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm },
  scanBtnTxt:   { color: '#fff', fontSize: FONT.sm, fontWeight: FONT.w7 },
  nextBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, paddingVertical: SPACE.md, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.brand, backgroundColor: COLORS.brandLight, marginBottom: SPACE.xl },
  nextBtnTxt:   { fontSize: FONT.sm, fontWeight: FONT.w7, color: COLORS.brand },
  tip:          { flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-start', backgroundColor: COLORS.borderLight, borderRadius: RADIUS.lg, padding: SPACE.md },
  tipTxt:       { flex: 1, fontSize: FONT.xs, color: COLORS.textTer, lineHeight: 18 },
});
