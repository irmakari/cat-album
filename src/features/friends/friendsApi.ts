import { supabase } from '@/lib/supabase';

// How someone stands with the signed-in user. "outgoing" is a request the
// user sent, "incoming" one they received.
export type Relation = 'friend' | 'incoming' | 'outgoing' | 'none';

// Only what other people may see of a profile.
export type Person = {
  id: string;
  username: string;
  relation: Relation;
};

export type Connection = Person & {
  // When the friendship began, or the request was sent.
  since: string;
};

export type MyProfile = {
  username: string | null;
  onLeaderboard: boolean;
};

export type LeaderboardRow = {
  userId: string;
  username: string;
  weekCats: number;
  kinds: number;
};

// A friend's cat as the server keeps it: no photo, only the image friends
// may see, through a short-lived link.
export type FriendCat = {
  id: string;
  breed: string;
  name: string | null;
  imageUrl: string | null;
  imageKind: 'sticker' | 'photo' | null;
  seenAt: string;
};

type PersonRow = { id: string; username: string; relation: Relation };

export async function fetchMyProfile(userId: string): Promise<MyProfile> {
  const { data, error } = await supabase.from('profiles').select('username, on_leaderboard').eq('id', userId).single();
  if (error) throw error;
  return { username: data.username, onLeaderboard: data.on_leaderboard };
}

// Resolves to false when someone else has the name.
export async function setUsername(userId: string, username: string): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ username }).eq('id', userId);
  if (error?.code === '23505') return false;
  if (error) throw error;
  return true;
}

export async function setOnLeaderboard(userId: string, onLeaderboard: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ on_leaderboard: onLeaderboard }).eq('id', userId);
  if (error) throw error;
}

// Friends and open requests both ways, most recent first.
export async function fetchConnections(): Promise<Connection[]> {
  const { data, error } = await supabase.rpc('list_connections');
  if (error) throw error;
  return (data ?? []) as Connection[];
}

// People whose username starts with the query. Fewer than two characters
// finds nobody.
export async function searchPeople(query: string): Promise<Person[]> {
  const { data, error } = await supabase.rpc('search_profiles', { query });
  if (error) throw error;
  return (data ?? []) as PersonRow[];
}

// The person an invite link names, or null if there is no one to add.
export async function findByUsername(username: string): Promise<Person | null> {
  const { data, error } = await supabase.rpc('get_profile_by_username', { name: username });
  if (error) throw error;
  return ((data ?? []) as PersonRow[])[0] ?? null;
}

// Asking someone who already asked you accepts their request.
export async function sendFriendRequest(id: string): Promise<Relation> {
  const { data, error } = await supabase.rpc('send_friend_request', { target: id });
  if (error) throw error;
  return data as Relation;
}

export async function respondToFriendRequest(id: string, accept: boolean): Promise<Relation> {
  const { data, error } = await supabase.rpc('respond_to_friend_request', { from_user: id, accept });
  if (error) throw error;
  return data as Relation;
}

// Unfriends, withdraws a request or declines one.
export async function removeFriend(id: string): Promise<void> {
  const { error } = await supabase.rpc('remove_friend', { other: id });
  if (error) throw error;
}

export async function blockUser(id: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', { target: id });
  if (error) throw error;
}

// Weeks run Monday to Sunday where the viewer is.
export async function fetchLeaderboard(weekOffset: 0 | -1): Promise<LeaderboardRow[]> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, error } = await supabase.rpc('friends_leaderboard', { tz, week_offset: weekOffset });
  if (error) throw error;
  return ((data ?? []) as { user_id: string; username: string; week_cats: number; kinds: number }[]).map((row) => ({
    userId: row.user_id,
    username: row.username,
    weekCats: row.week_cats,
    kinds: row.kinds,
  }));
}

const BUCKET = 'cat-images';
const LINK_SECONDS = 60 * 60;

// Newest first. Storage lets a friend read these images and no one else.
export async function fetchFriendCats(userId: string): Promise<FriendCat[]> {
  const { data, error } = await supabase
    .from('cats')
    .select('id, breed, name, image_path, image_kind, seen_at')
    .eq('user_id', userId)
    .order('seen_at', { ascending: false });
  if (error) throw error;

  const paths = data.flatMap((row) => (row.image_path ? [row.image_path] : []));
  const links = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, LINK_SECONDS);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) links.set(item.path, item.signedUrl);
    }
  }
  return data.map((row) => ({
    id: row.id,
    breed: row.breed,
    name: row.name,
    imageUrl: (row.image_path && links.get(row.image_path)) || null,
    imageKind: row.image_kind as FriendCat['imageKind'],
    seenAt: row.seen_at,
  }));
}
