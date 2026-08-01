import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Platform, Animated, Dimensions, Easing, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, SPACE, RADIUS, SHADOW, API_URL, API_HEADERS, fixMediaUrl } from '../theme';
import { GradientAvatar } from '../components';
import TopicPickerModal from './TopicPickerModal';

const { width: W, height: H } = Dimensions.get('window');

export default function ContactCardModal({ visible, onClose, onSent, sender, receiver, tokens }) {
  const [step,       setStep]       = useState('preview');
  const [topicModal, setTopicModal] = useState(false);
  const [error,      setError]      = useState('');

  const cardScale      = useRef(new Animated.Value(1)).current;
  const cardOpacity    = useRef(new Animated.Value(1)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current;
  const cardRotate     = useRef(new Animated.Value(0)).current;
  const plane1X  = useRef(new Animated.Value(0)).current;
  const plane1Y  = useRef(new Animated.Value(0)).current;
  const plane1O  = useRef(new Animated.Value(0)).current;
  const plane2X  = useRef(new Animated.Value(0)).current;
  const plane2Y  = useRef(new Animated.Value(0)).current;
  const plane2O  = useRef(new Animated.Value(0)).current;
  const plane3X  = useRef(new Animated.Value(0)).current;
  const plane3Y  = useRef(new Animated.Value(0)).current;
  const plane3O  = useRef(new Animated.Value(0)).current;
  const sentScale  = useRef(new Animated.Value(0)).current;
  const sentOpacity= useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const shimmerX   = useRef(new Animated.Value(-W)).current;

  const resetAll = () => {
    cardScale.setValue(1);
    cardOpacity.setValue(1);
    cardTranslateX.setValue(0);
    cardTranslateY.setValue(0);
    cardRotate.setValue(0);
    plane1X.setValue(0); plane1Y.setValue(0); plane1O.setValue(0);
    plane2X.setValue(0); plane2Y.setValue(0); plane2O.setValue(0);
    plane3X.setValue(0); plane3Y.setValue(0); plane3O.setValue(0);
    sentScale.setValue(0); sentOpacity.setValue(0); checkScale.setValue(0);
    shimmerX.setValue(-W);
  };

  // Reset everything when modal opens/closes or receiver changes
  useEffect(() => {
    setStep('preview');
    setError('');
    resetAll();

    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerX, { toValue: W * 2, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(shimmerX, { toValue: -W, duration: 0, useNativeDriver: true }),
          Animated.delay(1500),
        ])
      ).start();
    }
  }, [visible, receiver?.id]);

  const runSendAnimation = (onComplete) => {
    Animated.parallel([
      Animated.timing(cardScale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
      Animated.timing(cardTranslateY, { toValue: -10, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(cardTranslateX, { toValue: W + 100, duration: 700, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
        Animated.timing(cardTranslateY, { toValue: -80, duration: 700, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
        Animated.timing(cardRotate, { toValue: 1, duration: 700, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(plane1O, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(plane1X, { toValue: W * 0.5, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(plane1Y, { toValue: -60, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.timing(plane1O, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(plane2O, { toValue: 0.7, duration: 80, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(plane2X, { toValue: W * 0.35, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(plane2Y, { toValue: -35, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.timing(plane2O, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(220),
          Animated.timing(plane3O, { toValue: 0.5, duration: 80, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(plane3X, { toValue: W * 0.22, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(plane3Y, { toValue: -20, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.timing(plane3O, { toValue: 0, duration: 120, useNativeDriver: true }),
        ]),
      ]).start(() => onComplete && onComplete());
    });
  };

  const showSentState = () => {
    setStep('sent');
    Animated.sequence([
      Animated.spring(sentScale, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
      Animated.timing(sentOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.spring(checkScale, { toValue: 1, tension: 300, friction: 5, useNativeDriver: true }).start();
    }, 150);
  };

  const handleTopicConfirmed = async ({ topic, custom_topic }) => {
    setTopicModal(false);
    setStep('sending');
    runSendAnimation(showSentState);

    try {
      const res = await fetch(`${API_URL}/chat/requests/send/`, {
        method: 'POST',
        headers: { ...API_HEADERS, Authorization: `Bearer ${tokens?.access}` },
        body: JSON.stringify({
          receiver_id: receiver?.id,
          request_type: 'contact',
          topic,
          custom_topic,
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.already_connected) {
        setError(data.error || 'Failed to send. Please try again.');
        setStep('preview');
        resetAll();
        return;
      }
      if (onSent) onSent(data);
    } catch {
      setError('Network error. Please try again.');
      setStep('preview');
      resetAll();
    }
  };

  if (!sender || !receiver) return null;

  const interests = (sender.research_interests || '')
    .split(',').map(t => t.trim()).filter(Boolean).slice(0, 3);

  const receiverName = receiver.name || `${receiver.first_name || ''} ${receiver.last_name || ''}`.trim();
  const senderName   = `${sender.first_name || ''} ${sender.last_name || ''}`.trim();
  const senderPhoto  = fixMediaUrl(sender.profile_photo_url);

  const rotateDeg = cardRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <Animated.View style={s.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={step === 'sent' ? onClose : undefined}
          />

          <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
              <View>
                <Text style={s.headerTitle}>
                  {step === 'sent' ? '🎉 Card Sent!' : 'Your Contact Card'}
                </Text>
                {step === 'preview' && (
                  <Text style={s.headerSub}>
                    Sending to <Text style={{ fontWeight: FONT.w7, color: COLORS.brand }}>{receiverName}</Text>
                  </Text>
                )}
              </View>
              {step !== 'sending' && (
                <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                  <Ionicons name="close" size={18} color={COLORS.textSec} />
                </TouchableOpacity>
              )}
            </View>

            {/* Card */}
            {step !== 'sent' && (
              <View style={s.cardWrap}>
                <Animated.View style={[
                  s.cardContainer,
                  {
                    opacity: cardOpacity,
                    transform: [
                      { translateX: cardTranslateX },
                      { translateY: cardTranslateY },
                      { scale: cardScale },
                      { rotate: rotateDeg },
                    ],
                  },
                ]}>
                  <LinearGradient
                    colors={['#0333b6', '#022a8f', '#0f0f3d']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.card}
                  >
                    <Animated.View pointerEvents="none" style={[s.shimmer, { transform: [{ translateX: shimmerX }] }]} />
                    <View style={s.blob1} />
                    <View style={s.blob2} />

                    <View style={s.cardTop}>
                      {senderPhoto ? (
                        <Image
                          source={{ uri: senderPhoto }}
                          style={s.cardPhoto}
                        />
                      ) : (
                        <GradientAvatar
                          name={sender.first_name || sender.name || 'U'}
                          size={60} radius={20}
                          style={s.cardAvatarStyle}
                        />
                      )}
                      <View style={s.cardInfo}>
                        <Text style={s.cardName}>{senderName}</Text>
                        {sender.designation ? (
                          <Text style={s.cardDesig} numberOfLines={1}>{sender.designation}</Text>
                        ) : null}
                        {sender.affiliation ? (
                          <View style={s.cardAffRow}>
                            <Ionicons name="business-outline" size={10} color="rgba(255,255,255,0.5)" />
                            <Text style={s.cardAff} numberOfLines={1}>{sender.affiliation}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {interests.length > 0 && (
                      <View style={s.cardTags}>
                        {interests.map(tag => (
                          <View key={tag} style={s.cardTag}>
                            <Text style={s.cardTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={s.cardDivider} />
                    <View style={s.cardFooter}>
                      <Ionicons name="mail-outline" size={10} color="rgba(255,255,255,0.35)" />
                      <Text style={s.cardEmail} numberOfLines={1}>{sender.email}</Text>
                      <View style={s.etdBadge}>
                        <Text style={s.etdBadgeText}>ETD 2026</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>

                {/* Paper planes */}
                <Animated.View style={[s.plane, s.plane1, { opacity: plane1O, transform: [{ translateX: plane1X }, { translateY: plane1Y }] }]}>
                  <Text style={{ fontSize: 28 }}>✈️</Text>
                </Animated.View>
                <Animated.View style={[s.plane, s.plane2, { opacity: plane2O, transform: [{ translateX: plane2X }, { translateY: plane2Y }] }]}>
                  <Text style={{ fontSize: 18 }}>✈️</Text>
                </Animated.View>
                <Animated.View style={[s.plane, s.plane3, { opacity: plane3O, transform: [{ translateX: plane3X }, { translateY: plane3Y }] }]}>
                  <Text style={{ fontSize: 11 }}>✈️</Text>
                </Animated.View>
              </View>
            )}

            {/* Sent state */}
            {step === 'sent' && (
              <Animated.View style={[s.sentWrap, { opacity: sentOpacity, transform: [{ scale: sentScale }] }]}>
                <View style={s.sentRing}>
                  <LinearGradient colors={[COLORS.success, '#059669']} style={s.sentIconBg}>
                    <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                      <Ionicons name="checkmark" size={40} color="#fff" />
                    </Animated.View>
                  </LinearGradient>
                </View>
                <Text style={s.sentTitle}>Contact Card Sent!</Text>
                <Text style={s.sentSub}>
                  <Text style={{ fontWeight: FONT.w7, color: COLORS.brand }}>{receiverName}</Text>
                  {' '}will receive a notification and can accept to start chatting with you.
                </Text>
                <TouchableOpacity style={s.doneBtn} onPress={onClose} activeOpacity={0.85}>
                  <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.doneBtnInner}>
                    <Text style={s.doneBtnText}>Done</Text>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Error */}
            {!!error && (
              <View style={s.errorRow}>
                <Ionicons name="alert-circle-outline" size={15} color={COLORS.error} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Action buttons */}
            {step === 'preview' && (
              <View style={s.actions}>
                <View style={s.hintRow}>
                  <Ionicons name="information-circle-outline" size={14} color={COLORS.textTer} />
                  <Text style={s.hintText}>They must accept before you can start chatting.</Text>
                </View>
                <TouchableOpacity style={s.sendBtn} onPress={() => setTopicModal(true)} activeOpacity={0.85}>
                  <LinearGradient colors={[COLORS.brand, COLORS.brandDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sendBtnInner}>
                    <Ionicons name="paper-plane" size={20} color="#fff" />
                    <Text style={s.sendBtnText}>Send Contact Card</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </Modal>

      <TopicPickerModal
        visible={topicModal}
        onClose={() => setTopicModal(false)}
        onConfirm={handleTopicConfirmed}
        title="Conversation Topic"
      />
    </>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(7,6,20,0.75)',
    justifyContent: 'center', alignItems: 'center', padding: SPACE.xl,
  },
  container: {
    backgroundColor: '#fff', borderRadius: 32,
    width: '100%', maxWidth: 400, overflow: 'hidden', padding: SPACE.xl,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.4, shadowRadius: 40 },
      android: { elevation: 24 },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: SPACE.xl,
  },
  headerTitle: { fontSize: FONT.lg, fontWeight: FONT.w9, color: COLORS.text },
  headerSub:   { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 3 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },

  cardWrap: { marginBottom: SPACE.xl, position: 'relative' },
  cardContainer: {
    borderRadius: 24, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: COLORS.brand, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24 },
      android: { elevation: 12 },
      default: {},
    }),
  },
  card: { padding: SPACE.xl, borderRadius: 24, overflow: 'hidden', minHeight: 160 },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: [{ skewX: '-20deg' }],
  },
  blob1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -70, right: -50,
  },
  blob2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(245,158,11,0.06)', bottom: -40, left: -30,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, marginBottom: SPACE.lg },
  cardPhoto: {
    width: 60, height: 60, borderRadius: 20,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  cardAvatarStyle: { borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.35)' },
  cardInfo: { flex: 1 },
  cardName:  { fontSize: FONT.md, fontWeight: FONT.w8, color: '#fff', letterSpacing: -0.3 },
  cardDesig: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  cardAffRow:{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  cardAff:   { fontSize: FONT.xs, color: 'rgba(255,255,255,0.45)', flex: 1 },
  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs, marginBottom: SPACE.lg },
  cardTag: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  cardTagText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: FONT.w5 },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: SPACE.md },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  cardEmail:  { fontSize: FONT.xs, color: 'rgba(255,255,255,0.35)', flex: 1 },
  etdBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACE.sm, paddingVertical: 2, borderRadius: RADIUS.full,
  },
  etdBadgeText: { fontSize: 9, fontWeight: FONT.w7, color: 'rgba(255,255,255,0.5)' },

  plane: { position: 'absolute', zIndex: 99 },
  plane1: { bottom: 60, left: 40 },
  plane2: { bottom: 70, left: 60 },
  plane3: { bottom: 80, left: 80 },

  sentWrap: { alignItems: 'center', paddingVertical: SPACE.lg },
  sentRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.xl,
    ...Platform.select({
      ios: { shadowColor: COLORS.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  sentIconBg: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  sentTitle: { fontSize: FONT.xl, fontWeight: FONT.w9, color: COLORS.text, marginBottom: SPACE.md, letterSpacing: -0.3 },
  sentSub: {
    fontSize: FONT.sm, color: COLORS.textSec,
    textAlign: 'center', lineHeight: 22, marginBottom: SPACE.xl, paddingHorizontal: SPACE.md,
  },
  doneBtn: { width: '100%', borderRadius: RADIUS.xl, overflow: 'hidden' },
  doneBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACE.sm, paddingVertical: SPACE.lg,
  },
  doneBtnText: { fontSize: FONT.md, fontWeight: FONT.w7, color: '#fff' },

  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.sm,
    backgroundColor: COLORS.errorLight, borderRadius: RADIUS.md,
    padding: SPACE.md, marginBottom: SPACE.md,
  },
  errorText: { fontSize: FONT.xs, color: COLORS.error, flex: 1 },

  actions: { gap: SPACE.md },
  hintRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.xs,
    backgroundColor: COLORS.borderLight, borderRadius: RADIUS.md, padding: SPACE.md,
  },
  hintText: { fontSize: FONT.xs, color: COLORS.textSec, flex: 1, lineHeight: 18 },
  sendBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  sendBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACE.md, paddingVertical: SPACE.lg + 2,
  },
  sendBtnText: { fontSize: FONT.md, fontWeight: FONT.w7, color: '#fff', letterSpacing: 0.3 },
  cancelBtn: { alignItems: 'center', paddingVertical: SPACE.sm },
  cancelText: { fontSize: FONT.sm, color: COLORS.textTer, fontWeight: FONT.w5 },
});
