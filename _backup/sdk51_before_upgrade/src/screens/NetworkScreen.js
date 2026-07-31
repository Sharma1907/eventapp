import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Platform, ScrollView, TextInput,
  TouchableOpacity, Image, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACE, RADIUS, API_URL, API_HEADERS } from '../theme';
import { GradientAvatar, FadeIn } from '../components';

export default function NetworkScreen({ tokens }) {
  const [attendees,  setAttendees]  = useState([]);
  const [interests,  setInterests]  = useState([]);
  const [search,     setSearch]     = useState('');
  const [activeTag,  setActiveTag]  = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim())   params.append('search', search.trim());
      if (activeTag)        params.append('interest', activeTag);
      const url = `${API_URL}/checkins/network/?${params.toString()}`;
      const res = await fetch(url, {
        headers: { ...API_HEADERS, Authorization: `Bearer ${tokens?.access}` },
      });
      const data = await res.json();
      setAttendees(data.attendees || []);
      if (!activeTag && !search.trim()) setInterests(data.interests || []);
    } catch (e) { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [tokens, search, activeTag]);

  useEffect(() => { load(); }, [load]);

  const toggleTag = (tag) => {
    setActiveTag(prev => prev === tag ? '' : tag);
  };

  return (
    <View style={s.bg}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Network</Text>
        <Text style={s.sub}>Connect with fellow attendees</Text>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textTer} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, affiliation..."
            placeholderTextColor={COLORS.textTer}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => load()}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textTer} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Interest filter chips */}
      {interests.length > 0 && (
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
            {attendees.length} attendee{attendees.length !== 1 ? 's' : ''} checked in
          </Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : attendees.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="people-outline" size={48} color={COLORS.borderLight} />
          <Text style={s.emptyTitle}>No attendees yet</Text>
          <Text style={s.emptySub}>
            {search || activeTag ? 'Try a different search or filter' : 'Check-in is required to appear here'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.brand} />
          }
        >
          {attendees.map((a, i) => (
            <FadeIn key={a.id} delay={i * 40}>
              <View style={s.card}>
                <View style={s.cardRow}>
                  {a.profile_photo_url ? (
                    <Image source={{ uri: a.profile_photo_url }} style={s.photo} />
                  ) : (
                    <GradientAvatar name={a.name} size={48} radius={14} />
                  )}
                  <View style={s.cardInfo}>
                    <Text style={s.cardName}>{a.name}</Text>
                    {a.designation ? <Text style={s.cardDesig}>{a.designation}</Text> : null}
                    {a.affiliation ? (
                      <View style={s.affRow}>
                        <Ionicons name="business-outline" size={11} color={COLORS.textTer} />
                        <Text style={s.cardAff}>{a.affiliation}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={s.roleBadge}>
                    <Text style={s.roleBadgeText}>
                      {(a.role || '').replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
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
                          onPress={() => toggleTag(t)}
                        >
                          <Text style={[s.tagText, activeTag === t && s.tagTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            </FadeIn>
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}
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
  title: { fontSize: 28, fontWeight: '900', color: COLORS.brand, letterSpacing: -0.5 },
  sub:   { fontSize: FONT.xs, color: COLORS.textTer, marginTop: 3 },

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

  countRow:  { paddingHorizontal: SPACE.xl, paddingVertical: SPACE.sm },
  countText: { fontSize: FONT.xs, color: COLORS.textTer, fontWeight: FONT.w6 },

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

  roleBadge:     { backgroundColor: COLORS.brandLight, paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  roleBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.brand, letterSpacing: 0.5 },

  tagsRow: { flexDirection: 'row', marginTop: SPACE.md, gap: SPACE.sm },
  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs, flex: 1 },
  tag:     { backgroundColor: COLORS.brandLight, paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  tagActive:     { backgroundColor: COLORS.brand },
  tagText:       { fontSize: 10, fontWeight: '600', color: COLORS.brand },
  tagTextActive: { color: '#fff' },
});
