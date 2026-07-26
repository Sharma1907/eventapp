import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, RefreshControl,
  StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, SHADOW, API_URL, API_HEADERS } from '../theme';
import { Card, Badge, FadeIn } from '../components';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen({ tokens, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/my/`, {
        headers: { ...API_HEADERS, 'Authorization': `Bearer ${tokens.access}` },
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.log('Failed to fetch notifications:', err.message);
    }
    setLoading(false);
    setRefreshing(false);
  }, [tokens]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/notifications/mark-read/`, {
        method: 'POST',
        headers: { ...API_HEADERS, 'Authorization': `Bearer ${tokens.access}` },
        body: JSON.stringify({ notification_ids: [notificationId] }),
      });
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.log('Mark read failed:', err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/mark-all-read/`, {
        method: 'POST',
        headers: { ...API_HEADERS, 'Authorization': `Bearer ${tokens.access}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.log('Mark all read failed:', err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <LinearGradient colors={['#0333b6', '#0448c8']} style={st.header}>
        <View style={st.headerRow}>
          <TouchableOpacity onPress={onBack} style={st.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textInverse} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={st.headerTitle}>Notifications</Text>
            <Text style={st.headerSub}>{unreadCount} unread</Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={st.markAllBtn}>
              <Text style={st.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Curve */}
      <View style={{ backgroundColor: '#0448c8', height: 22 }}>
        <View style={st.curve} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACE.xxl }}>
          <View style={st.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={40} color={COLORS.textTer} />
          </View>
          <Text style={st.emptyTitle}>No notifications yet</Text>
          <Text style={st.emptyText}>You'll receive updates about conference events, announcements, and more.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.brand]} />}
        >
          {notifications.map((n, i) => (
            <FadeIn key={n.id} delay={i * 50}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => !n.read && markAsRead(n.notification_id)}
              >
                <Card
                  style={[st.notifCard, !n.read && st.notifCardUnread]}
                  shadow="sm"
                >
                  <View style={st.notifRow}>
                    <View style={[st.iconBox, !n.read && st.iconBoxUnread]}>
                      <Ionicons
                        name={n.read ? 'notifications-outline' : 'notifications'}
                        size={18}
                        color={n.read ? COLORS.textTer : COLORS.brand}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={st.notifTopRow}>
                        <Text style={[st.notifTitle, !n.read && st.notifTitleUnread]} numberOfLines={1}>
                          {n.title}
                        </Text>
                        {!n.read && <View style={st.unreadDot} />}
                      </View>
                      <Text style={st.notifBody} numberOfLines={2}>{n.body}</Text>
                      <Text style={st.notifTime}>{timeAgo(n.delivered_at || n.created_at)}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </FadeIn>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 42,
    paddingBottom: SPACE.lg,
    paddingHorizontal: SPACE.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACE.md,
  },
  headerTitle: {
    fontSize: FONT.lg,
    fontWeight: FONT.w8,
    color: COLORS.textInverse,
  },
  headerSub: {
    fontSize: FONT.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  markAllBtn: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.md,
  },
  markAllText: {
    fontSize: FONT.xs,
    fontWeight: FONT.w6,
    color: COLORS.textInverse,
  },
  curve: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xxxl,
    borderTopRightRadius: RADIUS.xxxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.lg,
  },
  emptyTitle: {
    fontSize: FONT.md,
    fontWeight: FONT.w7,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  emptyText: {
    fontSize: FONT.sm,
    color: COLORS.textTer,
    textAlign: 'center',
    lineHeight: 20,
  },
  notifCard: {
    padding: SPACE.md,
    marginBottom: SPACE.sm,
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.brand,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxUnread: {
    backgroundColor: COLORS.brandLight,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: FONT.sm,
    fontWeight: FONT.w6,
    color: COLORS.textSec,
    flex: 1,
    marginRight: SPACE.sm,
  },
  notifTitleUnread: {
    color: COLORS.text,
    fontWeight: FONT.w7,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brand,
  },
  notifBody: {
    fontSize: FONT.sm,
    color: COLORS.textSec,
    lineHeight: 20,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: FONT.xs,
    color: COLORS.textTer,
  },
});
