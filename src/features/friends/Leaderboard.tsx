import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, Glow, Icon, SegmentedControl, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { radii, spacing, useColors, type ColorName } from '@/theme';

import { fetchLeaderboard, type LeaderboardRow } from './friendsApi';

const medals: ColorName[] = ['gold', 'silver', 'bronze'];
// Pedestal heights for first, second and third.
const steps = [76, 54, 40];

function openRow(row: LeaderboardRow) {
  router.push({ pathname: '/friend/[id]', params: { id: row.userId, username: row.username } });
}

// One of the top three: a ringed avatar over a pedestal in its medal's tint.
function PodiumPlace({ row, place, mine }: { row: LeaderboardRow; place: number; mine: boolean }) {
  const colors = useColors();
  const medal = colors[medals[place]];
  const first = place === 0;
  const size = first ? 76 : 58;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Place ${place + 1}, @${row.username}${mine ? ', you' : ''}, ${row.weekCats} cats`}
      disabled={mine}
      onPress={() => openRow(row)}
      style={({ pressed }) => [styles.place, pressed && styles.pressed]}
    >
      {first ? <Icon name="crown.fill" size={20} color="gold" /> : null}
      <View style={first && { boxShadow: `0 0 28px ${medal}55`, borderRadius: size / 2 }}>
        <Avatar name={row.username} size={size} ring={medal} />
      </View>
      <View style={styles.placeText}>
        <Text variant="bodyStrong" color={mine ? 'accent' : 'text'} numberOfLines={1} align="center">
          {mine ? 'You' : `@${row.username}`}
        </Text>
        <View style={styles.score}>
          <Text variant="headline" color={first ? 'gold' : 'text'}>
            {row.weekCats}
          </Text>
          <Icon name="pawprint.fill" size={11} color="textMuted" />
        </View>
      </View>
      <View style={[styles.step, { height: steps[place], backgroundColor: `${medal}1F`, borderColor: `${medal}55` }]}>
        <Text variant="title" style={{ color: medal }}>
          {place + 1}
        </Text>
      </View>
    </Pressable>
  );
}

// A podium place no one has taken yet, so the podium keeps its shape.
function OpenPlace({ place }: { place: number }) {
  const colors = useColors();
  return (
    <View style={styles.place} accessible accessibilityLabel={`Place ${place + 1}, open`}>
      <View style={[styles.openAvatar, { borderColor: colors.borderStrong }]}>
        <Icon name="questionmark" size={18} color="textMuted" weight="semibold" />
      </View>
      <View style={styles.placeText}>
        <Text variant="bodyStrong" color="textMuted" align="center">
          Open
        </Text>
        <Text variant="headline" color="textMuted">
          –
        </Text>
      </View>
      <View
        style={[styles.step, { height: steps[place], backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
      >
        <Text variant="title" color="textMuted">
          {place + 1}
        </Text>
      </View>
    </View>
  );
}

function Podium({ rows, me }: { rows: LeaderboardRow[]; me: string | undefined }) {
  // Second on the left, first in the middle, third on the right.
  return (
    <View style={styles.podium}>
      {[1, 0, 2].map((place) =>
        place < rows.length ? (
          <PodiumPlace key={place} row={rows[place]} place={place} mine={rows[place].userId === me} />
        ) : (
          <OpenPlace key={place} place={place} />
        ),
      )}
    </View>
  );
}

// Everyone after the top three, one slim row each.
function RankRow({ row, place, mine, last }: { row: LeaderboardRow; place: number; mine: boolean; last: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Place ${place + 1}, @${row.username}${mine ? ', you' : ''}, ${row.weekCats} cats`}
      disabled={mine}
      onPress={() => openRow(row)}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
        mine && { backgroundColor: colors.accentSoft },
        pressed && { backgroundColor: colors.surfacePressed },
      ]}
    >
      <Text variant="bodyStrong" color={mine ? 'accent' : 'textMuted'} align="center" style={styles.rank}>
        {place + 1}
      </Text>
      <Avatar name={row.username} size={38} />
      <View style={styles.rowText}>
        <Text variant="bodyStrong" color={mine ? 'accent' : 'text'} numberOfLines={1}>
          {mine ? `@${row.username} · you` : `@${row.username}`}
        </Text>
        <Text variant="callout" color="textMuted">
          {row.kinds} of 40 kinds
        </Text>
      </View>
      <View style={[styles.chip, { backgroundColor: mine ? colors.accent : colors.surfaceMuted }]}>
        <Text variant="bodyStrong" color={mine ? 'onAccent' : 'text'}>
          {row.weekCats}
        </Text>
        <Icon name="pawprint.fill" size={11} color={mine ? 'onAccent' : 'textMuted'} />
      </View>
    </Pressable>
  );
}

// The user and their friends by cats found this week. `reloadKey` changes
// when the page is pulled to refresh.
export function Leaderboard({ reloadKey }: { reloadKey: number }) {
  const colors = useColors();
  const me = useAuth().session?.user.id;
  const [week, setWeek] = useState<'this' | 'last'>('this');
  // Kept with the week and reload they answer, so a switch shows a spinner
  // rather than the other week's rows.
  const [result, setResult] = useState<{ key: string; rows: LeaderboardRow[] | 'failed' } | null>(null);
  const key = `${week}:${reloadKey}`;

  // Fetched again each time the tab comes back into view, so a cat just
  // added shows without a pull; the rows already there stay until then.
  useFocusEffect(
    useCallback(() => {
      let current = true;
      fetchLeaderboard(week === 'this' ? 0 : -1)
        .then((rows) => current && setResult({ key, rows }))
        .catch(() => current && setResult({ key, rows: 'failed' }));
      return () => {
        current = false;
      };
    }, [week, key]),
  );

  const loaded = result?.key === key ? result.rows : null;
  const failed = loaded === 'failed';
  const rows = failed ? null : loaded;
  const rest = rows ? rows.slice(3) : [];

  return (
    <View style={styles.container}>
      <SegmentedControl
        options={[
          { value: 'this', label: 'This Week' },
          { value: 'last', label: 'Last Week' },
        ]}
        value={week}
        onChange={setWeek}
      />
      {rows === null || rows.length === 0 ? (
        <Card style={styles.state}>
          {failed ? (
            <Text variant="callout" color="textSecondary" align="center">
              Couldn’t load the leaderboard. Pull to try again.
            </Text>
          ) : rows ? (
            <Text variant="callout" color="textSecondary" align="center">
              No one has found a cat yet this week.
            </Text>
          ) : (
            <ActivityIndicator />
          )}
        </Card>
      ) : (
        <>
          <Card flush style={styles.stage}>
            <Glow x={0.5} y={0.15} reach={0.7} color={colors.gold} opacity={0.12} />
            <Podium rows={rows} me={me} />
          </Card>
          {rest.length > 0 ? (
            <Card flush>
              {rest.map((row, i) => (
                <RankRow
                  key={row.userId}
                  row={row}
                  place={i + 3}
                  mine={row.userId === me}
                  last={i === rest.length - 1}
                />
              ))}
            </Card>
          ) : null}
        </>
      )}
      {rows && rows.length <= 1 ? (
        <Text variant="callout" color="textMuted" align="center" style={styles.hint}>
          Add friends to race them. Only cats the camera recognises count, ten a day at most.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  state: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  stage: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  place: {
    flex: 1,
    maxWidth: 120,
    alignItems: 'center',
    gap: spacing.sm,
  },
  openAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeText: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  step: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rank: {
    width: 22,
    fontVariant: ['tabular-nums'],
  },
  rowText: {
    flex: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  pressed: {
    opacity: 0.75,
  },
  hint: {
    paddingHorizontal: spacing.xl,
  },
});
