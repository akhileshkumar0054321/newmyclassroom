-- MyClassroom.AI student workspace schema. Supabase SQL Editor me ek baar run karein.
-- Hinglish: RLS ke bina browser se data private nahi rahega, isliye har table protected hai.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  uid text unique not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  display_name text not null default 'Student',
  created_at timestamptz not null default now()
);

create or replace function public.create_student_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values(new.id, coalesce(nullif(split_part(new.email,'@',1),''),'Student'))
  on conflict(id) do nothing;
  return new;
end; $$;
drop trigger if exists student_profile_on_signup on auth.users;
create trigger student_profile_on_signup after insert on auth.users
for each row execute function public.create_student_profile();
insert into public.profiles(id,display_name)
select id, coalesce(nullif(split_part(email,'@',1),''),'Student') from auth.users
on conflict(id) do nothing;

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check(kind in ('NOTE','TEST','RESULT')),
  title text not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  constraint cannot_connect_self check(requester_id <> recipient_id),
  constraint unique_connection unique(requester_id,recipient_id)
);

create table if not exists public.library_grants (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(owner_id,viewer_id),
  check(owner_id <> viewer_id)
);

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  creator_id uuid not null references public.profiles(id),
  created_at timestamptz default now()
);
create table if not exists public.group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key(group_id,user_id)
);
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null default '',
  attachment_path text,
  attachment_name text,
  message_type text not null default 'text' check(message_type in ('text','file','voice')),
  created_at timestamptz default now(),
  check(length(body) <= 5000)
);
create table if not exists public.meeting_invites (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references public.profiles(id),
  callee_id uuid not null references public.profiles(id),
  status text not null default 'pending' check(status in ('pending','accepted','declined','ended')),
  created_at timestamptz default now(),
  check(caller_id <> callee_id)
);
create table if not exists public.meeting_signals (
  id bigint generated always as identity primary key,
  meeting_id uuid not null references public.meeting_invites(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  payload jsonb not null,
  created_at timestamptz default now()
);

create or replace function public.is_group_member(g uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.group_members where group_id=g and user_id=(select auth.uid()));
$$;
create or replace function public.is_connected(a uuid,b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.connections where status='accepted'
  and ((requester_id=a and recipient_id=b) or (requester_id=b and recipient_id=a)));
$$;

alter table public.profiles enable row level security;
alter table public.library_items enable row level security;
alter table public.connections enable row level security;
alter table public.library_grants enable row level security;
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.meeting_invites enable row level security;
alter table public.meeting_signals enable row level security;

create policy "Students can discover UID" on public.profiles for select to authenticated using (true);
create policy "Update own profile" on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
-- Hinglish: UID aur owner IDs ko browser update nahi kar sakta.
revoke update on public.profiles from authenticated;
grant update(display_name) on public.profiles to authenticated;

create policy "Read owned or granted library" on public.library_items for select to authenticated
using(owner_id=(select auth.uid()) or exists(select 1 from public.library_grants g
 where g.owner_id=library_items.owner_id and g.viewer_id=(select auth.uid()) and public.is_connected(g.owner_id,g.viewer_id)));
create policy "Insert own library" on public.library_items for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "Delete own library" on public.library_items for delete to authenticated using(owner_id=(select auth.uid()));

create policy "Read participant connections" on public.connections for select to authenticated
using(requester_id=(select auth.uid()) or recipient_id=(select auth.uid()));
create policy "Send own connection request" on public.connections for insert to authenticated
with check(requester_id=(select auth.uid()) and status='pending');
create policy "Recipient manages requests" on public.connections for update to authenticated
using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));
revoke update on public.connections from authenticated;
grant update(status) on public.connections to authenticated;
create policy "Participants disconnect" on public.connections for delete to authenticated
using(requester_id=(select auth.uid()) or recipient_id=(select auth.uid()));
create policy "Read grants for involved users" on public.library_grants for select to authenticated
using(owner_id=(select auth.uid()) or viewer_id=(select auth.uid()));
create policy "Owner grants access" on public.library_grants for insert to authenticated
with check(owner_id=(select auth.uid()) and public.is_connected(owner_id,viewer_id));
create policy "Owner revokes access" on public.library_grants for delete to authenticated using(owner_id=(select auth.uid()));

create policy "Read member groups" on public.study_groups for select to authenticated
using(public.is_group_member(id) or creator_id=(select auth.uid()));
create policy "Create own group" on public.study_groups for insert to authenticated with check(creator_id=(select auth.uid()));
create policy "Members read membership" on public.group_members for select to authenticated using(public.is_group_member(group_id));
create policy "Creator joins group" on public.group_members for insert to authenticated
with check(user_id=(select auth.uid()) and exists(select 1 from public.study_groups where id=group_id and creator_id=(select auth.uid())));
create policy "Members can leave" on public.group_members for delete to authenticated using(user_id=(select auth.uid()));
create policy "Members read messages" on public.group_messages for select to authenticated using(public.is_group_member(group_id));
create policy "Members write messages" on public.group_messages for insert to authenticated
with check(sender_id=(select auth.uid()) and public.is_group_member(group_id));

create policy "Read own meeting invitations" on public.meeting_invites for select to authenticated
using(caller_id=(select auth.uid()) or callee_id=(select auth.uid()));
create policy "Call another student" on public.meeting_invites for insert to authenticated
with check(caller_id=(select auth.uid()) and status='pending');
create policy "Callee responds to meeting" on public.meeting_invites for update to authenticated
using(callee_id=(select auth.uid())) with check(callee_id=(select auth.uid()));
revoke update on public.meeting_invites from authenticated;
grant update(status) on public.meeting_invites to authenticated;

create or replace function public.end_meeting(target_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.meeting_invites set status='ended' where id=target_id
  and (caller_id=auth.uid() or callee_id=auth.uid());
end; $$;
grant execute on function public.end_meeting(uuid) to authenticated;
create policy "Participants read signaling" on public.meeting_signals for select to authenticated
using(exists(select 1 from public.meeting_invites m where m.id=meeting_id
and (m.caller_id=(select auth.uid()) or m.callee_id=(select auth.uid()))));
create policy "Participants send signaling" on public.meeting_signals for insert to authenticated
with check(sender_id=(select auth.uid()) and exists(select 1 from public.meeting_invites m where m.id=meeting_id
and m.status='accepted' and (m.caller_id=(select auth.uid()) or m.callee_id=(select auth.uid()))));

-- Hinglish: Group owner hi UID se members add kar sakta hai; public insert ki permission nahi.
create or replace function public.add_group_member_by_uid(target_group uuid,target_uid text) returns void
language plpgsql security definer set search_path = '' as $$
declare target_user uuid;
begin
  if not exists(select 1 from public.study_groups where id=target_group and creator_id=auth.uid()) then
    raise exception 'Only the group creator can invite students';
  end if;
  select id into target_user from public.profiles where uid=upper(trim(target_uid));
  if target_user is null then raise exception 'UID not found'; end if;
  insert into public.group_members(group_id,user_id) values(target_group,target_user) on conflict do nothing;
end; $$;
grant execute on function public.add_group_member_by_uid(uuid,text) to authenticated;

-- Private file bucket; paths always start with authenticated uploader UID.
insert into storage.buckets(id,name,public,file_size_limit) values('study-attachments','study-attachments',false,10485760)
on conflict(id) do nothing;
create policy "Group file upload" on storage.objects for insert to authenticated
with check(bucket_id='study-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Group file read" on storage.objects for select to authenticated
using(bucket_id='study-attachments' and exists (
  select 1 from public.group_messages gm where gm.attachment_path=storage.objects.name and public.is_group_member(gm.group_id)));

-- Realtime changes are filtered by each subscriber's RLS policies.
do $$ declare t text; begin
  foreach t in array array['connections','library_grants','group_members','group_messages','meeting_invites','meeting_signals'] loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I',t);
    end if;
  end loop;
end $$;
