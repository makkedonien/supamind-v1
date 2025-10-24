# Vault API Key Migration - Implementation Summary

## Overview
Successfully migrated API key storage from plain text in the profiles table to encrypted storage using Supabase Vault.

## Changes Implemented

### Database Migrations

#### 1. `20260128000000_add_vault_api_key_functions.sql`
Created two PostgreSQL functions for secure API key management:
- **`store_user_api_key(p_user_id, p_api_key, p_key_name)`**: 
  - Stores API keys in vault with unique naming pattern `{user_id}_{key_name}`
  - Returns the vault secret UUID
  - Uses SECURITY DEFINER to allow authenticated users to write to vault
  
- **`delete_user_api_key(p_secret_id, p_user_id)`**:
  - Validates secret ownership before deletion
  - Deletes vault secret securely
  - Returns success boolean

#### 2. `20260128000001_migrate_to_vault_columns.sql`
Updated profiles table schema:
- **Added columns**:
  - `transcript_key_vault_secret` (uuid)
  - `openai_key_vault_secret` (uuid)
  - `gemini_key_vault_secret` (uuid)
  
- **Removed columns**:
  - `transcript_api_key` (text)
  - `openai_api_key` (text)
  - `gemini_api_key` (text)

### Frontend Changes

#### 3. TypeScript Types (`src/integrations/supabase/types.ts`)
- Updated `profiles` table Row, Insert, and Update types with new UUID columns
- Added function signatures for `store_user_api_key` and `delete_user_api_key`

#### 4. Profile Hook (`src/hooks/useProfile.tsx`)
- Updated `UpdateProfileData` interface to use new vault secret column names
- Profile queries now return UUID references instead of actual keys

#### 5. Settings Page (`src/pages/Settings.tsx`)
Major updates to API key management UI:

**Save Handlers**:
- Each save handler now:
  1. Calls `store_user_api_key()` RPC function to store key in vault
  2. Updates profile with returned UUID
  3. Clears input and shows masked value (`••••••••`)

**Remove Handlers**:
- Added three remove handlers (transcript, openai, gemini)
- Each calls `delete_user_api_key()` RPC function
- Updates profile to null after successful deletion
- Clears the input field

**UI Improvements**:
- Shows masked value (`••••••••`) when API key exists
- Dynamic placeholder text based on key existence
- Added "Remove" button next to each "Save" button when key exists
- Updated all references from old column names to new vault secret UUIDs
- Fixed podcast feed validation to check for `transcript_key_vault_secret`

## Security Improvements

1. **Encryption at Rest**: API keys are now stored encrypted using Supabase Vault's authenticated encryption
2. **No Plain Text Display**: Keys are never displayed after storage, only masked representations
3. **Ownership Validation**: Delete operations validate that users can only delete their own secrets
4. **Unique Naming**: Secrets use `{user_id}_{key_name}` pattern for easy identification and ownership tracking

## User Experience

- **Existing Users**: Must re-enter their API keys (as per plan - no automatic migration)
- **Masked Display**: When a key is saved, it shows `••••••••` instead of the actual key
- **Clear Feedback**: Placeholder text indicates whether a key is already set
- **Easy Removal**: Users can remove keys with a dedicated button

## Important Notes

### n8n Workflow Impact
⚠️ **The n8n workflow "Supamind - Podcast Episode Processor" will break** after this migration because it queries the old `transcript_api_key` column directly. 

**Current n8n query**:
```sql
SELECT transcript_api_key FROM profiles
WHERE id = '{{ $('Get GUIDs, User_ID, Podcast_ID').item.json.user_id }}'
```

**To fix later**, you'll need to either:
1. Update the n8n SQL query to join with `vault.decrypted_secrets` view, or
2. Create a Postgres function that returns the decrypted key and call it from n8n

## Testing Checklist

Before deploying to production:
- [ ] Test saving new API keys (transcript, openai, gemini)
- [ ] Verify keys show as masked after saving
- [ ] Test removing API keys
- [ ] Verify podcast feed adding requires transcript key
- [ ] Check that old references to plain text keys are removed
- [ ] Confirm vault secrets are properly created in database
- [ ] Test that users cannot access other users' secrets

## Deployment Steps

1. Run migrations in order:
   - `20260128000000_add_vault_api_key_functions.sql`
   - `20260128000001_migrate_to_vault_columns.sql`

2. Deploy frontend changes

3. Notify users that they need to re-enter their API keys

4. Update n8n workflows (separate task)

## Files Modified

### Created:
- `supabase/migrations/20260128000000_add_vault_api_key_functions.sql`
- `supabase/migrations/20260128000001_migrate_to_vault_columns.sql`

### Modified:
- `src/integrations/supabase/types.ts`
- `src/hooks/useProfile.tsx`
- `src/pages/Settings.tsx`

