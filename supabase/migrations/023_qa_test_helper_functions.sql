-- Migration: QA Test Helper Functions
-- Purpose: Helper functions for automated database testing
-- Created: 2025-12-17

/**
 * These functions are used by the QA test suite to verify database
 * structure, constraints, and security features.
 */

-- ============================================================================
-- FUNCTION: Check if RLS is enabled on a table
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rls_enabled(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = table_name;

  RETURN COALESCE(rls_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_rls_enabled IS 'Check if Row Level Security is enabled on a table (used by QA tests)';

-- ============================================================================
-- FUNCTION: Check if an index exists
-- ============================================================================

CREATE OR REPLACE FUNCTION check_index_exists(index_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  index_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = index_name
  ) INTO index_exists;

  RETURN index_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_index_exists IS 'Check if an index exists by name (used by QA tests)';

-- ============================================================================
-- FUNCTION: Check if multiple indexes exist
-- ============================================================================

CREATE OR REPLACE FUNCTION check_indexes_exist(index_names TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  idx TEXT;
  all_exist BOOLEAN := TRUE;
BEGIN
  FOREACH idx IN ARRAY index_names LOOP
    IF NOT check_index_exists(idx) THEN
      all_exist := FALSE;
      EXIT;
    END IF;
  END LOOP;

  RETURN all_exist;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_indexes_exist IS 'Check if all indexes in array exist (used by QA tests)';

-- ============================================================================
-- FUNCTION: Check if a trigger exists
-- ============================================================================

CREATE OR REPLACE FUNCTION check_trigger_exists(
  trigger_name TEXT,
  table_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE t.tgname = trigger_name
    AND c.relname = table_name
  ) INTO trigger_exists;

  RETURN trigger_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_trigger_exists IS 'Check if a trigger exists on a table (used by QA tests)';

-- ============================================================================
-- FUNCTION: Check if a constraint exists
-- ============================================================================

CREATE OR REPLACE FUNCTION check_constraint_exists(
  constraint_name TEXT,
  table_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  -- First check table_constraints
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = constraint_name
    AND table_name = table_name
  ) INTO constraint_exists;

  -- If not found, check indexes (unique indexes act as constraints)
  IF NOT constraint_exists THEN
    SELECT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE indexname = constraint_name
      AND tablename = table_name
    ) INTO constraint_exists;
  END IF;

  RETURN constraint_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_constraint_exists IS 'Check if a constraint exists on a table (used by QA tests)';

-- ============================================================================
-- FUNCTION: Check if a database function exists
-- ============================================================================

CREATE OR REPLACE FUNCTION check_function_exists(function_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = function_name
  ) INTO function_exists;

  RETURN function_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_function_exists IS 'Check if a function exists by name (used by QA tests)';

-- ============================================================================
-- FUNCTION: Execute arbitrary SQL (for testing purposes only)
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_sql(query TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a dangerous function - only allow in test environment
  -- In production, this should be removed or restricted further

  EXECUTE query INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION execute_sql IS 'DANGEROUS: Execute arbitrary SQL (TEST ENVIRONMENT ONLY)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to call these functions (needed for tests)
GRANT EXECUTE ON FUNCTION check_rls_enabled(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_index_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_indexes_exist(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_trigger_exists(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_constraint_exists(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_function_exists(TEXT) TO authenticated;

-- Restrict execute_sql to service role only
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO service_role;
REVOKE EXECUTE ON FUNCTION execute_sql(TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION execute_sql(TEXT) FROM anon;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO audit_logs (
  user_id,
  event_type,
  event_category,
  event_status,
  event_data,
  created_at
) VALUES (
  NULL,
  'database_migration',
  'admin',
  'success',
  jsonb_build_object(
    'migration', 'qa_test_helper_functions',
    'date', '2025-12-17',
    'description', 'Added helper functions for QA database testing',
    'functions', ARRAY[
      'check_rls_enabled',
      'check_index_exists',
      'check_indexes_exist',
      'check_trigger_exists',
      'check_constraint_exists',
      'check_function_exists',
      'execute_sql'
    ]
  ),
  NOW()
);
