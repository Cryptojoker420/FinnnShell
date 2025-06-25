-- Create user_identity_map table
create table if not exists user_identity_map (
  user_id uuid references auth.users(id) primary key,
  email text,
  wallet_address text,
  twitter_handle text,
  user_agent text,
  fingerprint text,
  timezone text,
  screen_resolution text,
  ussid text,
  origin text,
  last_seen timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on fingerprint for faster lookups
create index if not exists user_identity_map_fingerprint_idx on user_identity_map(fingerprint);

-- Add RLS policies
alter table user_identity_map enable row level security;

-- Allow users to read their own identity
create policy "Users can view their own identity"
  on user_identity_map for select
  using (auth.uid() = user_id);

-- Only allow service role to insert/update identity
create policy "Service role can manage identity"
  on user_identity_map for all
  using (true);

-- Create function to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_user_identity_map_updated_at
  before update on user_identity_map
  for each row
  execute function update_updated_at_column(); 