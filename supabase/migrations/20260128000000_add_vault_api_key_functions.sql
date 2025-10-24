-- Migration: Add Vault helper functions for API key management
-- File: supabase/migrations/20260128000000_add_vault_api_key_functions.sql

BEGIN;

-- Function to store an API key in the vault and return the secret UUID
CREATE OR REPLACE FUNCTION public.store_user_api_key(
  p_user_id uuid,
  p_api_key text,
  p_key_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_id uuid;
  v_secret_name text;
BEGIN
  -- Validate inputs
  IF p_api_key IS NULL OR trim(p_api_key) = '' THEN
    RAISE EXCEPTION 'API key cannot be empty';
  END IF;
  
  IF p_key_name IS NULL OR trim(p_key_name) = '' THEN
    RAISE EXCEPTION 'Key name cannot be empty';
  END IF;

  -- Create a unique name for the secret: {user_id}_{key_name}
  v_secret_name := p_user_id::text || '_' || p_key_name;

  -- Store the secret in the vault
  v_secret_id := vault.create_secret(
    p_api_key,
    v_secret_name,
    'User API key for ' || p_key_name
  );

  RETURN v_secret_id;
END;
$$;

-- Function to delete an API key from the vault
CREATE OR REPLACE FUNCTION public.delete_user_api_key(
  p_secret_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret_name text;
  v_expected_prefix text;
BEGIN
  -- Validate inputs
  IF p_secret_id IS NULL THEN
    RAISE EXCEPTION 'Secret ID cannot be null';
  END IF;

  -- Get the secret name to verify ownership
  SELECT name INTO v_secret_name
  FROM vault.decrypted_secrets
  WHERE id = p_secret_id;

  -- If secret doesn't exist, return false
  IF v_secret_name IS NULL THEN
    RETURN false;
  END IF;

  -- Verify the secret belongs to the user
  v_expected_prefix := p_user_id::text || '_';
  IF NOT v_secret_name LIKE v_expected_prefix || '%' THEN
    RAISE EXCEPTION 'Unauthorized: Secret does not belong to user';
  END IF;

  -- Delete the secret from the vault table
  DELETE FROM vault.secrets
  WHERE id = p_secret_id;

  RETURN true;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.store_user_api_key(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_api_key(uuid, uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.store_user_api_key IS 'Stores a user API key securely in the vault and returns the secret UUID';
COMMENT ON FUNCTION public.delete_user_api_key IS 'Deletes a user API key from the vault after verifying ownership';

COMMIT;

