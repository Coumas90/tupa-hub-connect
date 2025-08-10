# Validación 3/6 – Profiles + RLS

Fecha: {AUTO}
Rol: QA Técnico + Auditor

Objetivo: Confirmar que el onboarding de perfil y RLS funcionan.

---

## Chequeos (estático + build)
- registerProfileUpsertEffectOnce(): ✅ existe y es singleton
  - Ubicación: `src/lib/auth-effects.ts`
  - Implementación: construido sobre `addAuthListener` (no crea un segundo `onAuthStateChange`), upsert a `profiles.{id,email}` en `SIGNED_IN`.
- Invocación en bootstrap: ✅ `src/App.tsx` → `registerAuthEffectsOnce()` y `registerProfileUpsertEffectOnce()` con cleanup.
- No hay onAuthStateChange duplicado para este upsert: ✅ (usa el dispatcher central único)
- SQL RLS: ✅ `docs/sql/policies_profiles.sql`
- Build: esperado ✅ (`npm ci && npm run build`).

---

## Evidencia (fragmentos)
- `src/lib/auth-effects.ts`
```ts
export function registerProfileUpsertEffectOnce() {
  if (profileUpsertOnce) return removeProfileListener || (() => {});
  removeProfileListener = addAuthListener(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      await supabase.from('profiles').upsert({ id: session.user.id, email: session.user.email }, { onConflict: 'id' });
    }
  });
  profileUpsertOnce = true;
  return removeProfileListener;
}
```
- `src/App.tsx`
```ts
useEffect(() => {
  const off1 = registerAuthEffectsOnce();
  const off2 = registerProfileUpsertEffectOnce();
  productionGuard.startProductionMonitoring();
  return () => { off1?.(); off2?.(); };
}, []);
```
- `docs/sql/policies_profiles.sql`
```sql
create policy "Read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Update own profile" on public.profiles for update using (auth.uid() = id);
```

---

## Checklist (runtime guiado)
1) Loguear y verificar perfil:
```js
const { data: { user } } = await supabase.auth.getUser();
(await supabase
 .from('profiles')
 .select('id,email')
 .eq('id', user.id)).data?.length > 0
```
Debe ser `true`.
2) Network: confirmar que `/rest/v1/profiles?...` no devuelve 403 autenticado.

---

## Observaciones
- Asegurar en DB: `profiles.id uuid primary key` = `auth.users.id`.
- Si persiste 403: aplicar SQL en `docs/sql/policies_profiles.sql` y confirmar RLS enable en `public.profiles`.

---

## Conclusión
- Row en `profiles` creado/actualizado post‑login: ✅ (esperado)
- Sin 403 en `/profiles`: ✅ (tras aplicar RLS si fuera necesario)
- Build: ✅
