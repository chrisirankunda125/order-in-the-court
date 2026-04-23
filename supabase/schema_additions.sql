-- ============================================================
-- Schema additions — run after schema.sql
-- ============================================================

-- Link roster entries to auth users (set when player claims their spot)
alter table players add column if not exists user_id uuid references auth.users(id);

-- Players can read the roster entry they have claimed
create policy "player: read own roster entry" on players
  for select using (auth.uid() = user_id);

-- Players can read unclaimed entries on a team they belong to
-- (so they can claim their spot via invite flow)
create policy "player: see unclaimed roster on joined team" on players
  for select using (
    user_id is null and
    exists (
      select 1 from team_members
      where team_members.coach_id = players.coach_id
        and team_members.player_id = auth.uid()
    )
  );

-- Players can claim their own entry (set user_id once)
create policy "player: claim own entry" on players
  for update using (user_id is null)
  with check (auth.uid() = user_id);

-- ── Storage bucket for training media ───────────────────────
-- Run in Supabase dashboard → Storage → New bucket
-- Name: training-media, Public: true
--
-- Then add these policies in Storage → training-media → Policies:

insert into storage.buckets (id, name, public)
values ('training-media', 'training-media', true)
on conflict (id) do nothing;

create policy "authenticated users upload training media"
  on storage.objects for insert
  with check (
    bucket_id = 'training-media'
    and auth.role() = 'authenticated'
  );

create policy "public read training media"
  on storage.objects for select
  using (bucket_id = 'training-media');

create policy "users delete own training media"
  on storage.objects for delete
  using (bucket_id = 'training-media' and auth.uid()::text = (storage.foldername(name))[1]);
