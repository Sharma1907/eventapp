import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Platform, TouchableOpacity,
  FlatList, RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, TOP, API_URL, API_HEADERS, fixMediaUrl } from '../theme';
import { GradientAvatar, FadeIn } from '../components';

const POLL_MS = 30000;

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function ChatListScreen({ tokens, onBack, onOpenChat, onOpenRequests, pendingCount }) {
  const [conversations, setConversations] = useState([]);
  const [totalUnread,   setTotalUnread]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/chat/conversations/`, {
        headers: { ...API_HEADERS, Authorization: `Bearer ${tokens?.access}` },
      });
      const data = await res.json();
      setConversations((data.conversations || []).map(c => ({
        ...c,
        other_user: c.other_user ? {
          ...c.other_user,
          profile_photo_url: fixMediaUrl(c.other_user.profile_photo_url),
        } : c.other_user,
      })));
      setTotalUnread(data.total_unread || 0);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [tokens]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const renderItem = ({ item: conv, index }) => {
    const other    = conv.other_user;
    const lastMsg  = conv.last_message;
    const hasUnread= conv.unread_count > 0;

    return (
      <FadeIn delay={index * 40}>
        <TouchableOpacity
          style={[s.convCard, hasUnread && s.convCardUnread]}
          onPress={() => onOpenChat(conv.id)}
          activeOpacity={0.78}
        >
          <View style={s.convRow}>
            {/* Avatar */}
            {other?.profile_photo_url ? (
              <Image source={{ uri: other.profile_photo_url }} style={s.convPhoto} />
            ) : (
              <GradientAvatar name={other?.name || '?'} size={52} radius={16} />
            )}

            {/* Unread dot */}
            {hasUnread && <View style={s.unreadDot} />}

            <View style={{ flex: 1, marginLeft: SPACE.md }}>
              <View style={s.convTopRow}>
                <Text style={[s.convName, hasUnread && s.convNameBold]} numberOfLines={1}>
                  {other?.name || 'Unknown'}
                </Text>
                <Text style={s.convTime}>
                  {timeAgo(conv.last_message_at || conv.created_at)}
                </Text>
              </View>

              <View style={s.topicChip}>
                <Text style={s.topicChipText}>{conv.topic_display}</Text>
              </View>

              <View style={s.convPreviewRow}>
                <Text style={[s.convPreview, hasUnread && s.convPreviewBold]} numberOfLines={1}>
                  {lastMsg
                    ? (lastMsg.message_type === 'image' ? '📷 Photo' : lastMsg.content)
                    : 'Start the conversation...'}
                </Text>
                {hasUnread && (
                  <View style={s.unreadBadge}>
                    <Text style={s.unreadBadgeText}>{conv.unread_count}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </FadeIn>
    );
  };

  return (
    <View style={s.bg}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: SPACE.md }}>
          <Text style={s.title}>Chats</Text>
          {totalUnread > 0 && (
            <Text style={s.sub}>{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</Text>
          )}
        </View>
        {/* Requests button */}
        <TouchableOpacity style={s.reqBtn} onPress={onOpenRequests} activeOpacity={0.8}>
          <Ionicons name="mail-outline" size={20} color={COLORS.brand} />
          {pendingCount > 0 && (
            <View style={s.reqBadge}>
              <Text style={s.reqBadgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={c => c.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={COLORS.brand}
            />
          }
          ListEmptyComponent={
            <View style={s.center}>
              <View style={s.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={36} color={COLORS.brand} />
              </View>
              <Text style={s.emptyTitle}>No conversations yet</Text>
              <Text style={s.emptySub}>
                Send a contact card from the Network tab to start connecting with attendees.
              </Text>
              {pendingCount > 0 && (
                <TouchableOpacity
                  style={s.emptyReqBtn}
                  onPress={onOpenRequests}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail-outline" size={16} color="#fff" />
                  <Text style={s.emptyReqBtnText}>View {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f0f4f9' },

  header: {
    paddingTop: TOP, paddingBottom: SPACE.md,
    paddingHorizontal: SPACE.xl,
    backgroundColor: '#f0f4f9',
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  title: { fontSize: FONT.xl, fontWeight: FONT.w8, color: COLORS.text },
  sub:   { fontSize: FONT.xs, color: COLORS.brand, marginTop: 1 },

  reqBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  reqBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 2, borderColor: '#f0f4f9',
  },
  reqBadgeText: { fontSize: 9, fontWeight: FONT.w8, color: '#fff' },

  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: SPACE.xxxl, gap: SPACE.md,
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 28,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACE.sm,
  },
  emptyTitle: { fontSize: FONT.lg, fontWeight: FONT.w7, color: COLORS.text },
  emptySub:   { fontSize: FONT.sm, color: COLORS.textTer, textAlign: 'center', lineHeight: 20 },
  emptyReqBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE.sm,
    backgroundColor: COLORS.brand, borderRadius: RADIUS.xl,
    paddingVertical: SPACE.md, paddingHorizontal: SPACE.xl,
    marginTop: SPACE.sm,
  },
  emptyReqBtnText: { fontSize: FONT.sm, fontWeight: FONT.w7, color: '#fff' },

  listContent: { padding: SPACE.xl, paddingBottom: 100 },

  convCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    padding: SPACE.lg, marginBottom: SPACE.md,
    ...Platform.select({
      ios: { shadowColor: '#002182', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 0 },
    }),
  },
  convCardUnread: {
    borderColor: COLORS.brand + '40',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  convRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  convPhoto: { width: 52, height: 52, borderRadius: 16 },
  unreadDot: {
    position: 'absolute', top: 0, left: 38,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.brand,
    borderWidth: 2, borderColor: '#f0f4f9',
    zIndex: 1,
  },
  convTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  convName:     { fontSize: FONT.sm, fontWeight: FONT.w6, color: COLORS.text, flex: 1 },
  convNameBold: { fontWeight: FONT.w8 },
  convTime:     { fontSize: FONT.xs, color: COLORS.textTer },

  topicChip: {
    alignSelf: 'flex-start', marginBottom: SPACE.xs,
    backgroundColor: COLORS.brandLight,
    paddingHorizontal: SPACE.sm, paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  topicChipText: { fontSize: 9, fontWeight: FONT.w7, color: COLORS.brand },

  convPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convPreview:      { fontSize: FONT.xs, color: COLORS.textTer, flex: 1 },
  convPreviewBold:  { color: COLORS.text, fontWeight: FONT.w6 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.brand,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5, marginLeft: SPACE.sm,
  },
  unreadBadgeText: { fontSize: 10, fontWeight: FONT.w8, color: '#fff' },
});
