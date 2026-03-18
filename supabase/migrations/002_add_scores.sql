-- Add professional scores and community ratings columns
alter table wines add column if not exists critic_scores jsonb default '[]';
alter table wines add column if not exists community_score numeric;
alter table wines add column if not exists quality_percentile integer;
