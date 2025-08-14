# Cafes to Locations Migration

This document outlines the plan to migrate existing `cafes`-based data models to the new `locations` model.

## Migration Steps
1. **Schema Update**  
   - Add `location_id` columns to `feedbacks`, `giveaway_participants`, and `giveaway_winners` tables.  
   - Backfill new columns using the `cafes_locations_mapping` table.  
   - Drop legacy `cafe_id` columns and related indexes.  
   - Update RLS policies to scope access by `location_id`.
2. **Edge Functions**  
   - Update QR generation and weekly giveaway selection functions to work with `location_id`.  
   - Preserve backward compatibility where a related `cafe_id` is still required for legacy data.
3. **Frontend Routes and Components**  
   - Replace `/cafe/:cafeId` routes with `/location/:locationId`.  
   - Update dashboard and feedback components to query by `location_id`.

## Fallback Strategy
- Keep the `cafes` table and `cafes_locations_mapping` for lookup during transition.  
- Edge functions update `cafes` metadata when possible to maintain existing integrations.  
- If issues arise, the migration can be rolled back by restoring the previous columns and policies from backups prior to running the migration.

## Verification
- Run ESLint and existing test suites after applying the migration.  
- Manually verify that feedback submission and giveaway flows continue to operate using `location_id`.
