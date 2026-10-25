-- Private bucket for customer photos.
--
-- Photos never go through our server (Vercel rejects requests over 4.5 MB and phone photos
-- are often bigger). The server hands out a one-time upload link and the browser uploads
-- straight here. The bucket is private: reading needs a short-lived link from our server.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-photos', 'chat-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No policies for anon or authenticated, so nobody can list, read, or write this bucket
-- with a public key. Only our server's secret key (which bypasses RLS) can.
-- Owner access to their own client's photos comes with the owner portal.
