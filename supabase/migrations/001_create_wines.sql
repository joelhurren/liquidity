-- Liquidity Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Wines table
create table if not exists wines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Core info
  name text not null default '',
  producer text default '',
  vintage integer,
  region text default '',
  country text default '',
  appellation text default '',
  grape_varieties text[] default '{}',
  type text default 'red',
  color text default '',
  -- Inventory
  bottles integer default 1,
  purchase_price numeric,
  purchase_date text,
  purchase_location text default '',
  -- Drinking window
  drink_from integer,
  drink_to integer,
  -- Ratings & Notes
  rating numeric,
  reviews jsonb default '[]',
  tasting_notes text default '',
  -- Food pairings
  food_pairings text[] default '{}',
  -- Image (base64 or URL)
  image_data text,
  -- Extra
  alcohol_percent numeric,
  classification text default '',
  storage_location text default ''
);

-- Enable Row Level Security
alter table wines enable row level security;

-- Policy: Users can only see their own wines
create policy "Users can view own wines"
  on wines for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own wines
create policy "Users can insert own wines"
  on wines for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own wines
create policy "Users can update own wines"
  on wines for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own wines
create policy "Users can delete own wines"
  on wines for delete
  using (auth.uid() = user_id);

-- Index for faster user queries
create index if not exists wines_user_id_idx on wines(user_id);
create index if not exists wines_created_at_idx on wines(created_at desc);

-- Function to auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger wines_updated_at
  before update on wines
  for each row execute function update_updated_at();
