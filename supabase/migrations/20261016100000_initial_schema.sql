-- Cat Album initial schema: profiles, the kinds of cat the album has slots
-- for, the cats each user collected, and storage for their stickers.
--
-- Accounts start anonymous (Supabase anonymous sign-in) and become
-- permanent when the user adds an email. Both are the `authenticated` role;
-- what needs a permanent account checks `is_permanent()`.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- False for anonymous accounts, which can collect but not be found.
create or replace function public.is_permanent()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false;
$$;

-- ---------------------------------------------------------------------------
-- Profiles: one row per account, made automatically on sign-up, anonymous
-- or not. The username is chosen before the friends pages.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  -- Off hides the user from their friends' leaderboards.
  on_leaderboard boolean not null default true,
  created_at timestamptz not null default now()
);

-- Pattern ops, so the same index serves both uniqueness and prefix search.
create unique index profiles_username_key
  on public.profiles (username text_pattern_ops);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Breeds: the album's slots. The app holds names and order; this holds the
-- ids, so a cat can only be filed under a slot that exists and the
-- leaderboard's "kinds" cannot be inflated with made-up ones.
-- Add new ids in a later migration; never rename or remove one.
-- ---------------------------------------------------------------------------

create table public.breeds (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$')
);

insert into public.breeds (id) values
  ('tabby'), ('ginger'), ('tuxedo'), ('calico'), ('tortoiseshell'),
  ('black'), ('white'), ('grey'), ('cream'), ('bicolor'),
  ('turkish-van'), ('turkish-angora'), ('british-shorthair'), ('scottish-fold'),
  ('persian'), ('maine-coon'), ('siamese'), ('ragdoll'), ('bengal'), ('sphynx'),
  ('russian-blue'), ('norwegian-forest'), ('siberian'), ('abyssinian'), ('birman'),
  ('exotic-shorthair'), ('american-shorthair'), ('devon-rex'), ('cornish-rex'),
  ('burmese'), ('oriental-shorthair'), ('himalayan'), ('savannah'), ('egyptian-mau'),
  ('chartreux'), ('somali'), ('tonkinese'), ('manx'), ('bombay'), ('ragamuffin');

-- ---------------------------------------------------------------------------
-- Cats: one row per cat a user met. The id is made on the phone, so a cat
-- keeps the same id offline, on the server, and as its sticker's key.
-- ---------------------------------------------------------------------------

create table public.cats (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  breed text not null references public.breeds (id),
  name text check (char_length(btrim(name)) between 1 and 40),
  -- Object path inside the private "cat-images" bucket: the sticker, or a
  -- small photo where no sticker could be made. Null until uploaded.
  image_path text,
  image_kind text check (image_kind in ('sticker', 'photo')),
  -- Whether the phone saw a cat in the photo. Only these count on the
  -- leaderboard.
  has_cat boolean not null default false,
  seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint cats_image_has_kind check ((image_path is null) = (image_kind is null)),
  constraint cats_seen_not_future check (seen_at <= created_at + interval '1 hour')
);

create index cats_user_seen_idx
  on public.cats (user_id, seen_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security: each user reaches only their own cats here. Friends
-- are let in by the friends migration.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.breeds enable row level security;
alter table public.cats enable row level security;

revoke all on public.profiles, public.breeds, public.cats from anon, authenticated;

grant select on public.profiles to authenticated;
-- Only these columns may change; the username through its own rules below.
grant update (username, on_leaderboard) on public.profiles to authenticated;
grant select on public.breeds to authenticated;
grant select, insert, delete on public.cats to authenticated;
grant update (breed, name, image_path, image_kind) on public.cats to authenticated;

create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

-- A username is how others find you, so only a permanent account takes one.
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id and (username is null or public.is_permanent()));

create policy "Anyone signed in reads the breeds"
  on public.breeds for select to authenticated
  using (true);

create policy "Users read their own cats"
  on public.cats for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users add their own cats"
  on public.cats for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own cats"
  on public.cats for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own cats"
  on public.cats for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Image storage: a private bucket where each user owns the folder named
-- after their id, "<user id>/<cat id>.png". Stickers are small, background
-- free PNGs; photos are small JPEGs re-encoded on the phone, which drops
-- their location.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cat-images', 'cat-images', false, 2097152, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "Users read their own cat images"
  on storage.objects for select to authenticated
  using (bucket_id = 'cat-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload their own cat images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cat-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users replace their own cat images"
  on storage.objects for update to authenticated
  using (bucket_id = 'cat-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'cat-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own cat images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'cat-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Deleting an account from inside the app. The profile and cats go with the
-- auth user through their foreign keys; images live in storage, which has
-- no such link, so the app empties the user's folder before calling this.
-- ---------------------------------------------------------------------------

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
