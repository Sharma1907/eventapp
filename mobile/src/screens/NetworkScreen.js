import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Platform, ScrollView, TextInput,
  TouchableOpacity, Image, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, API_URL, API_HEADERS, fixMediaUrl } from '../theme';
import { GradientAvatar, FadeIn } from '../components';
import ContactCardModal from './ContactCardModal';
import SpeakerRequestModal from './SpeakerRequestModal';

const TABS = ['Attendees', 'Speakers'];

export default function NetworkScreen({ tokens, user, onOpenChat, pendingCount, onOpenRequests }) {
  const [activeTab,  setActiveTab]  = useState('Attendees');
  const [attendees,  setAttendees]  = useState([]);
  const [speakers,   setSpeakers]   = useState([]);
  const [interests,  setInterests]  = useState([]);
  const [search,     setSearch]     = useState('');
  const [activeTag,  setActiveTag]  = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Card modals
  const [cardTarget,    setCardTarget]    = useState(null);  // user object for ContactCardModal
  const [speakerTarget, setSpeakerTarget] = useState(null);  // user object for SpeakerRequestModal

  // Connection status cache: { [userId]: { status, conversation_id } }
  const [connStatus, setConnStatus] = useState({});

  // Load all connection statuses for visible users in bulk
  const loadStatuses = useCallback(async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    const results = await Promise.allSettled(
      userIds.map(id =>
        fetch(`${API_URL}/chat/check/${id}/`, {
          headers: { ...API_HEADERS, Authorization: `Bearer ${tokens?.access}` },
        }).then(r => r.json()).then(d => ({ id, data: d }))
      )
    );
    const updates = {};
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value?.data) {
        updates[r.value.id] = r.value.data;
      }
    });
    setConnStatus(prev => ({ ...prev, ...updates }));
  }, [tokens]);

  const loadAttendees = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (activeTag)      params.append('interest', activeTag);
      const res  = await fetch(
        `${API_URL}/checkins/network/?${params.toString()}`,
        { headers: { ...API_HEADERS, Authorization: `Bearer ${tokens?.access}` } }
      );
      const data = await res.json();
      const list = (data.attendees || []).filter(a => a.role !== 'speaker').map(a => ({
        ...a, profile_photo_url: fixMediaUrl(a.profile_photo_url),
      }));
      setAttendees(list);
      if (!activeTag && !search.trim()) setInterests(data.interests || []);
      // Load connection status for all visible attendees
      const ids = list.map(a => a.id).filter(id => id !== user?.id);
      loadStatuses(ids);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [tokens, search, activeTag]);

  const loadSpeakers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      params.append('role', 'speaker');
      const res  = await fetch(
        `${API_URL}/checkins/network/?${params.toString()}`,
        { headers: { ...API_HEADERS, Authorization: `Bearer ${tokens?.access}` } }
      );
      const data = await res.json();
      const list = (data.attendees || []).filter(a => a.role === 'speaker').map(a => ({
        ...a, profile_photo_url: fixMediaUrl(a.profile_photo_url),
      }));
      setSpeakers(list);
      const ids = list.map(a => a.id).filter(id => id !== user?.id);
      loadStatuses(ids);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [tokens, search]);

  useEffect(() => {
    if (activeTab === 'Attendees') loadAttendees();
    else loadSpeakers();
  }, [activeTab, loadAttendees, loadSpeakers]);

  const toggleTag = (tag) => setActiveTag(prev => prev === tag ? '' : tag);

  const checkConnection = async (userId) => {
    if (connStatus[userId]) return connStatus[userId];
    try {
      const res  = await fetch(`${API_URL}/chat/check/${userId}/`, {
        headers: { ...API_HEADERS, Authorization: `Bearer ${tokens?.access}` },
      });
      const data = await res.json();
      setConnStatus(prev => ({ ...prev, [userId]: data }));
      return data;
    } catch { return { status: 'none' }; }
  };

  const handleAttendeePress = (attendee) => {
    const cached = connStatus[attendee.id];
    if (cached) {
      if (cached.status === 'connected') {
        onOpenChat && onOpenChat(cached.conversation_id);
        return;
      }
      if (cached.status === 'pending_sent') return;
    }
    // Close any open modal first, then open for new target
    setCardTarget(null);
    setTimeout(() => setCardTarget(attendee), 50);
    checkConnection(attendee.id);
  };

  const handleSpeakerPress = (speaker) => {
    const cached = connStatus[speaker.id];
    if (cached) {
      if (cached.status === 'connected') {
        onOpenChat && onOpenChat(cached.conversation_id);
        return;
      }
      if (cached.status === 'pending_sent') return;
    }
    setSpeakerTarget(speaker);
    checkConnection(speaker.id);
  };

  const getActionInfo = (userId) => {
    const st = connStatus[userId];
    if (!st || st.status === 'none') return null;
    if (st.status === 'connected')        return { label: 'Chat',    icon: 'chatbubble-outline',  color: COLORS.success, status: 'connected' };
    if (st.status === 'pending_sent')     return { label: 'Pending', icon: 'time-outline',        color: COLORS.accent,  status: 'pending_sent' };
    if (st.status === 'pending_received') return { label: 'Respond', icon: 'mail-outline',        color: COLORS.brand,   status: 'pending_received' };
    return null;
  };

  const currentList = activeTab === 'Attendees' ? attendees : speakers;

  // My research interests for mutual highlight
  const myInterests = new Set(
    (user?.research_interests || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  );

  return (
    <View style={s.bg}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.title}>Network</Text>
          {/* Requests inbox button */}
          <TouchableOpacity style={s.reqBtn} onPress={onOpenRequests} activeOpacity={0.8}>
            <Ionicons name="mail-outline" size={20} color={COLORS.brand} />
            {pendingCount > 0 && (
              <View style={s.reqDot}>
                <Text style={s.reqDotText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={s.sub}>Connect with conference participants</Text>
      </View>

      {/* Tab toggle */}
      <View style={s.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => { setActiveTab(tab); setSearch(''); setActiveTag(''); }}
            activeOpacity={0.75}
          >
            <Ionicons
              name={tab === 'Attendees' ? 'people-outline' : 'mic-outline'}
              size={14}
              color={activeTab === tab ? '#fff' : COLORS.textSec}
            />
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textTer} />
          <TextInput
            style={s.searchInput}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            placeholderTextColor={COLORS.textTer}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => activeTab === 'Attendees' ? loadAttendees() : loadSpeakers()}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textTer} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Interest filter chips — attendees only */}
      {activeTab === 'Attendees' && interests.length > 0 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={s.chipsScroll}
          contentContainerStyle={s.chipsContainer}
        >
          {interests.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[s.chip, activeTag === tag && s.chipActive]}
              onPress={() => toggleTag(tag)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, activeTag === tag && s.chipTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Count */}
      {!loading && (
        <View style={s.countRow}>
          <Text style={s.countText}>
            {currentList.length} {activeTab.toLowerCase()} checked in
          </Text>
        </View>
      )}

      {/* Speaker info note */}
      {activeTab === 'Speakers' && !loading && speakers.length > 0 && (
        <View style={s.speakerNote}>
          <Ionicons name="shield-checkmark-outline" size={13} color={COLORS.purple} />
          <Text style={s.speakerNoteText}>
            Speakers review all discussion requests before accepting.
          </Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : currentList.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="people-outline" size={48} color={COLORS.borderLight} />
          <Text style={s.emptyTitle}>No {activeTab.toLowerCase()} yet</Text>
          <Text style={s.emptySub}>
            {search || activeTag ? 'Try a different search or filter' : 'Check-in is required to appear here'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => activeTab === 'Attendees' ? loadAttendees(true) : loadSpeakers(true)}
              tintColor={COLORS.brand}
            />
          }
        >
          {currentList.map((a, i) => {
            const isSelf   = a.id === user?.id;
            const actionInfo = getActionInfo(a.id);

            return (
              <FadeIn key={a.id} delay={i * 40}>
                <View style={s.card}>
                  <View style={s.cardRow}>
                    {a.profile_photo_url ? (
                      <Image source={{ uri: a.profile_photo_url }} style={s.photo} />
                    ) : (
                      <GradientAvatar name={a.name} size={48} radius={14} />
                    )}
                    <View style={s.cardInfo}>
                      <Text style={s.cardName}>{a.name}{isSelf ? ' (You)' : ''}</Text>
                      {a.designation ? <Text style={s.cardDesig}>{a.designation}</Text> : null}
                      {a.affiliation ? (
                        <View style={s.affRow}>
                          <Ionicons name="business-outline" size={11} color={COLORS.textTer} />
                          <Text style={s.cardAff}>{a.affiliation}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Action button — only non-self */}
                    {!isSelf && (
                      <TouchableOpacity
                        style={[
                          s.actionBtn,
                          activeTab === 'Speakers' && s.actionBtnSpeaker,
                          actionInfo && { backgroundColor: actionInfo.color + '20', borderColor: actionInfo.color + '40' },
                        ]}
                        onPress={() => {
                          const cs = connStatus[a.id];
                          if (cs?.status === 'connected' && cs?.conversation_id) {
                            onOpenChat && onOpenChat(cs.conversation_id);
                          } else if (cs?.status === 'pending_sent') {
                            // Already sent — do nothing
                          } else if (cs?.status === 'pending_received') {
                            onOpenRequests && onOpenRequests();
                          } else if (activeTab === 'Speakers') {
                            handleSpeakerPress(a);
                          } else {
                            handleAttendeePress(a);
                          }
                        }}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={
                            actionInfo ? actionInfo.icon
                            : activeTab === 'Speakers' ? 'chatbubble-ellipses-outline'
                            : 'person-add-outline'
                          }
                          size={14}
                          color={
                            actionInfo ? actionInfo.color
                            : activeTab === 'Speakers' ? COLORS.purple
                            : COLORS.brand
                          }
                        />
                        <Text style={[
                          s.actionBtnText,
                          activeTab === 'Speakers' && { color: COLORS.purple },
                          actionInfo && { color: actionInfo.color },
                        ]}>
                          {actionInfo ? actionInfo.label
                            : activeTab === 'Speakers' ? 'Request Chat'
                            : 'Connect'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Research interests */}
                  {a.research_interests ? (
                    <View style={s.tagsRow}>
                      <Ionicons name="flask-outline" size={12} color={COLORS.brand} style={{ marginTop: 2 }} />
                      <View style={s.tags}>
                        {a.research_interests.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                          <TouchableOpacity
                            key={t}
                            style={[s.tag, activeTag === t && s.tagActive]}
                            onPress={() => activeTab === 'Attendees' && toggleTag(t)}
                          >
                            <Text style={[s.tagText, activeTag === t && s.tagTextActive]}>{t}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              </FadeIn>
            );
          })}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* Contact Card Modal */}
      <ContactCardModal
        visible={!!cardTarget}
        onClose={() => { setCardTarget(null); }}
        onSent={() => {
          if (cardTarget) {
            // Mark as pending_sent in cache immediately
            setConnStatus(prev => ({
              ...prev,
              [cardTarget.id]: { status: 'pending_sent', conversation_id: null, request_id: null },
            }));
          }
          setCardTarget(null);
        }}
        sender={user}
        receiver={cardTarget}
        tokens={tokens}
      />

      {/* Speaker Request Modal */}
      <SpeakerRequestModal
        visible={!!speakerTarget}
        onClose={() => setSpeakerTarget(null)}
        speaker={speakerTarget}
        tokens={tokens}
        onSent={(data) => {
          if (speakerTarget) {
            if (data.already_connected && data.conversation_id) {
              setConnStatus(prev => ({
                ...prev,
                [speakerTarget.id]: { status: 'connected', conversation_id: data.conversation_id },
              }));
              setSpeakerTarget(null);
              onOpenChat && onOpenChat(data.conversation_id);
            } else {
              setConnStatus(prev => ({
                ...prev,
                [speakerTarget.id]: { status: 'pending_sent', conversation_id: null },
              }));
              setSpeakerTarget(null);
            }
          }
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f0f4f9' },

  header: {
    paddingTop: Platform.OS === 'ios' ? 58 : 46,
    paddingBottom: SPACE.sm,
    paddingHorizontal: SPACE.xl,
    backgroundColor: '#f0f4f9',
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.brand, letterSpacing: -0.5 },
  sub:   { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 3 },

  reqBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  reqDot: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 2, borderColor: '#f0f4f9',
  },
  reqDotText: { fontSize: 9, fontWeight: FONT.w8, color: '#fff' },

  tabRow: {
    flexDirection: 'row', gap: SPACE.sm,
    paddingHorizontal: SPACE.xl, marginBottom: SPACE.sm,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.xs,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: RADIUS.full, paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  tabActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  tabText:   { fontSize: FONT.sm, fontWeight: FONT.w6, color: COLORS.textSec },
  tabTextActive: { color: '#fff' },

  searchWrap: { paddingHorizontal: SPACE.xl, paddingVertical: SPACE.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.sm,
    backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: SPACE.lg, height: 44,
  },
  searchInput: { flex: 1, fontSize: FONT.sm, color: COLORS.text },

  chipsScroll:    { maxHeight: 44 },
  chipsContainer: { paddingHorizontal: SPACE.xl, gap: SPACE.sm, flexDirection: 'row', alignItems: 'center' },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs + 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  chipActive:     { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText:       { fontSize: FONT.xs, fontWeight: FONT.w6, color: COLORS.textSec },
  chipTextActive: { color: '#fff' },

  countRow:  { paddingHorizontal: SPACE.xl, paddingVertical: SPACE.xs },
  countText: { fontSize: FONT.xs, color: COLORS.textTer, fontWeight: FONT.w6 },

  speakerNote: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.xs,
    marginHorizontal: SPACE.xl, marginBottom: SPACE.sm,
    backgroundColor: COLORS.purpleLight,
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  speakerNoteText: { fontSize: FONT.xs, color: COLORS.purple },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACE.sm, padding: 32 },
  emptyTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textSec },
  emptySub:   { fontSize: FONT.sm, color: COLORS.textTer, textAlign: 'center' },

  listContainer: { paddingHorizontal: SPACE.xl },

  card: {
    backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    padding: SPACE.lg, marginBottom: SPACE.md,
    ...Platform.select({
      ios: { shadowColor: '#002182', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 0 },
    }),
  },
  cardRow:   { flexDirection: 'row', alignItems: 'center' },
  photo:     { width: 48, height: 48, borderRadius: 14 },
  cardInfo:  { flex: 1, marginLeft: SPACE.md },
  cardName:  { fontSize: FONT.sm, fontWeight: '700', color: COLORS.text },
  cardDesig: { fontSize: FONT.xs, color: COLORS.textSec, marginTop: 1 },
  affRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardAff:   { fontSize: FONT.xs, color: COLORS.textTer },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.brandLight,
    paddingHorizontal: SPACE.sm, paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.brandLight,
  },
  actionBtnSpeaker: {
    backgroundColor: COLORS.purpleLight,
    borderColor: COLORS.purpleLight,
  },
  actionBtnText: { fontSize: 10, fontWeight: FONT.w7, color: COLORS.brand },

  tagsRow: { flexDirection: 'row', marginTop: SPACE.md, gap: SPACE.sm },
  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs, flex: 1 },
  tag:     { backgroundColor: COLORS.brandLight, paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  tagActive:     { backgroundColor: COLORS.brand },
  tagMutual:     { backgroundColor: COLORS.accentLight, borderWidth: 1, borderColor: COLORS.accent + '50' },
  tagText:       { fontSize: 10, fontWeight: '600', color: COLORS.brand },
  tagTextActive: { color: '#fff' },
  tagTextMutual: { color: COLORS.accentDark },
});
