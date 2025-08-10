create policy "Read own profile" on public.profiles
for select using (auth.uid() = id);

create policy "Update own profile" on public.profiles
for update using (auth.uid() = id);
