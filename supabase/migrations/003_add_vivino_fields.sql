-- Add Vivino-specific fields for real community data
alter table wines add column if not exists community_ratings integer;
alter table wines add column if not exists vivino_url text;
