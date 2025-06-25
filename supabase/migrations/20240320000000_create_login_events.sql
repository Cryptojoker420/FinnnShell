-- Create login_events table
create table if not exists login_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  method text not null,
  event_type text not null,
  fingerprint text,
  user_agent text,
  timezone text,
  screen_resolution text,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on user_id for faster lookups
create index if not exists login_events_user_id_idx on login_events(user_id);

-- Create index on created_at for time-based queries
create index if not exists login_events_created_at_idx on login_events(created_at);

-- Add RLS policies
alter table login_events enable row level security;

-- Allow users to read their own login events
create policy "Users can view their own login events"
  on login_events for select
  using (auth.uid() = user_id);

-- Only allow service role to insert login events
create policy "Service role can insert login events"
  on login_events for insert
  with check (true); 