-- Create the wine-images storage bucket
insert into storage.buckets (id, name, public)
values ('wine-images', 'wine-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload images
create policy "Users can upload wine images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'wine-images');

-- Allow authenticated users to update their images
create policy "Users can update wine images"
on storage.objects for update
to authenticated
using (bucket_id = 'wine-images');

-- Allow anyone to view wine images (public bucket)
create policy "Anyone can view wine images"
on storage.objects for select
to public
using (bucket_id = 'wine-images');

-- Allow authenticated users to delete their images
create policy "Users can delete wine images"
on storage.objects for delete
to authenticated
using (bucket_id = 'wine-images');
