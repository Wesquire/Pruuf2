-- Migration: 10-Contact Limit Database Trigger
-- Date: 2025-12-07
-- Purpose: Enforce maximum 10 Contacts per Member (business rule)
-- Related: PLAN_BIG_BUILD.md Phase 1.3

-- ============================================================================
-- BACKGROUND
-- ============================================================================

/*
Business Rule: Each Member can have a maximum of 10 active Contacts.

Why this limit?
1. Prevents spam/abuse (one person inviting hundreds of contacts)
2. Keeps notification costs reasonable (10 contacts × alerts = manageable)
3. Reflects realistic use case (elderly person monitored by immediate family)
4. Can be increased later if needed (soft limit via trigger, not hard constraint)

This trigger prevents adding an 11th Contact to a Member.
*/

-- ============================================================================
-- PART 1: CREATE TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_contact_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_contact_count INT;
  member_name VARCHAR(255);
BEGIN
  -- Count active Contacts for this Member
  SELECT COUNT(*)
  INTO active_contact_count
  FROM member_contact_relationships
  WHERE member_id = NEW.member_id
    AND status = 'active';

  -- If trying to insert a new active relationship
  IF NEW.status = 'active' THEN
    -- Check if limit would be exceeded
    IF active_contact_count >= 10 THEN
      -- Get member name for better error message
      SELECT name INTO member_name
      FROM users
      WHERE id = NEW.member_id;

      -- Raise exception to prevent insert
      RAISE EXCEPTION 'Contact limit exceeded: % already has 10 active Contacts (maximum allowed). Remove a Contact before adding another.',
        COALESCE(member_name, 'Member');
    END IF;
  END IF;

  -- Allow the insert/update
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 2: CREATE TRIGGER
-- ============================================================================

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_enforce_contact_limit
ON member_contact_relationships;

-- Create trigger that fires BEFORE insert or update
CREATE TRIGGER trigger_enforce_contact_limit
BEFORE INSERT OR UPDATE ON member_contact_relationships
FOR EACH ROW
EXECUTE FUNCTION enforce_contact_limit();

-- ============================================================================
-- PART 3: ADD HELPER FUNCTION TO CHECK REMAINING SLOTS
-- ============================================================================

-- Function to check how many more Contacts a Member can add
CREATE OR REPLACE FUNCTION get_remaining_contact_slots(p_member_id UUID)
RETURNS INT AS $$
DECLARE
  active_count INT;
  remaining INT;
BEGIN
  -- Count active Contacts
  SELECT COUNT(*)
  INTO active_count
  FROM member_contact_relationships
  WHERE member_id = p_member_id
    AND status = 'active';

  -- Calculate remaining slots
  remaining := 10 - active_count;

  -- Return 0 if negative (shouldn't happen, but safeguard)
  RETURN GREATEST(remaining, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 4: ADD HELPER FUNCTION TO GET CONTACT LIST WITH COUNT
-- ============================================================================

-- Function to get all Contacts for a Member with count
CREATE OR REPLACE FUNCTION get_member_contacts_with_limit(p_member_id UUID)
RETURNS TABLE (
  contact_id UUID,
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  relationship_status VARCHAR(20),
  connected_at TIMESTAMP WITH TIME ZONE,
  active_count INT,
  remaining_slots INT,
  at_limit BOOLEAN
) AS $$
DECLARE
  v_active_count INT;
  v_remaining INT;
BEGIN
  -- Get active contact count
  SELECT COUNT(*) INTO v_active_count
  FROM member_contact_relationships
  WHERE member_id = p_member_id AND status = 'active';

  v_remaining := 10 - v_active_count;

  -- Return contacts with limit info
  RETURN QUERY
  SELECT
    u.id AS contact_id,
    u.name AS contact_name,
    u.phone AS contact_phone,
    u.email AS contact_email,
    mcr.status AS relationship_status,
    mcr.connected_at,
    v_active_count AS active_count,
    v_remaining AS remaining_slots,
    (v_active_count >= 10) AS at_limit
  FROM member_contact_relationships mcr
  JOIN users u ON mcr.contact_id = u.id
  WHERE mcr.member_id = p_member_id
  ORDER BY mcr.connected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: UPDATE EXISTING MEMBERS WITH TOO MANY CONTACTS
-- ============================================================================

/*
If any Members already have >10 Contacts (shouldn't happen in fresh install,
but protects against edge cases), log them but don't auto-remove.

Admin must manually review and decide which Contacts to keep.
*/

DO $$
DECLARE
  v_member RECORD;
  v_count INT;
BEGIN
  -- Find Members with >10 active Contacts
  FOR v_member IN
    SELECT
      member_id,
      COUNT(*) as contact_count
    FROM member_contact_relationships
    WHERE status = 'active'
    GROUP BY member_id
    HAVING COUNT(*) > 10
  LOOP
    -- Log to audit_logs
    INSERT INTO audit_logs (
      user_id,
      action,
      details,
      created_at
    ) VALUES (
      v_member.member_id,
      'contact_limit_exceeded',
      jsonb_build_object(
        'member_id', v_member.member_id,
        'active_contacts', v_member.contact_count,
        'limit', 10,
        'action_required', 'Admin must manually remove excess contacts'
      ),
      NOW()
    );

    RAISE NOTICE 'Member % has % active Contacts (exceeds limit of 10)',
      v_member.member_id, v_member.contact_count;
  END LOOP;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RAISE NOTICE 'No Members exceed contact limit. Migration clean.';
  ELSE
    RAISE WARNING '% Members exceed contact limit. Review audit_logs for details.', v_count;
  END IF;
END $$;

-- ============================================================================
-- PART 6: ADD DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON FUNCTION enforce_contact_limit() IS 'Trigger function that enforces maximum 10 active Contacts per Member. Raises exception if limit would be exceeded.';

COMMENT ON FUNCTION get_remaining_contact_slots(UUID) IS 'Returns number of remaining Contact slots available for a Member (0-10). Used by frontend to show "X slots remaining".';

COMMENT ON FUNCTION get_member_contacts_with_limit(UUID) IS 'Returns all Contacts for a Member with limit information included. Used by Member dashboard to show contact list and capacity.';

-- ============================================================================
-- PART 7: TEST THE TRIGGER
-- ============================================================================

-- Test: Verify trigger prevents exceeding limit
-- (This is a validation test, not actual data insert)

DO $$
DECLARE
  test_member_id UUID := gen_random_uuid();
  test_contact_id UUID;
  i INT;
BEGIN
  -- Create test member
  INSERT INTO users (id, phone, name, created_at)
  VALUES (test_member_id, '+15555551234', 'Test Member', NOW());

  -- Create 10 active contacts (at limit)
  FOR i IN 1..10 LOOP
    test_contact_id := gen_random_uuid();

    INSERT INTO users (id, phone, name, created_at)
    VALUES (test_contact_id, '+1555555' || LPAD(i::TEXT, 4, '0'), 'Test Contact ' || i, NOW());

    INSERT INTO member_contact_relationships (
      member_id,
      contact_id,
      invite_code,
      status,
      connected_at
    ) VALUES (
      test_member_id,
      test_contact_id,
      'TEST' || LPAD(i::TEXT, 2, '0'),
      'active',
      NOW()
    );
  END LOOP;

  RAISE NOTICE 'Created 10 active Contacts for test member';

  -- Try to add 11th contact (should fail)
  BEGIN
    test_contact_id := gen_random_uuid();

    INSERT INTO users (id, phone, name, created_at)
    VALUES (test_contact_id, '+15555559999', 'Test Contact 11', NOW());

    INSERT INTO member_contact_relationships (
      member_id,
      contact_id,
      invite_code,
      status,
      connected_at
    ) VALUES (
      test_member_id,
      test_contact_id,
      'TEST11',
      'active',
      NOW()
    );

    -- If we reach here, trigger failed
    RAISE EXCEPTION 'TEST FAILED: Trigger did not prevent 11th contact';

  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Contact limit exceeded%' THEN
        RAISE NOTICE 'TEST PASSED: Trigger correctly prevented 11th contact';
      ELSE
        RAISE EXCEPTION 'TEST FAILED: Unexpected error: %', SQLERRM;
      END IF;
  END;

  -- Cleanup test data
  DELETE FROM member_contact_relationships WHERE member_id = test_member_id;
  DELETE FROM users WHERE id = test_member_id OR phone LIKE '+1555555%';

  RAISE NOTICE 'Test data cleaned up';
END $$;

-- ============================================================================
-- PART 8: LOG MIGRATION IN AUDIT TABLE
-- ============================================================================

INSERT INTO audit_logs (
  user_id,
  action,
  details,
  created_at
) VALUES (
  NULL,
  'database_migration',
  jsonb_build_object(
    'migration', 'contact_limit_trigger',
    'date', '2025-12-07',
    'description', 'Added trigger to enforce 10-Contact limit per Member',
    'limit', 10,
    'trigger_name', 'trigger_enforce_contact_limit',
    'function_name', 'enforce_contact_limit'
  ),
  NOW()
);

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Verify trigger was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trigger_enforce_contact_limit'
  ) THEN
    RAISE EXCEPTION 'Migration failed: Trigger not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'enforce_contact_limit'
  ) THEN
    RAISE EXCEPTION 'Migration failed: Trigger function not created';
  END IF;

  RAISE NOTICE 'Migration validation passed: Trigger and function created successfully';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

/*
To rollback this migration:

DROP TRIGGER IF EXISTS trigger_enforce_contact_limit ON member_contact_relationships;
DROP FUNCTION IF EXISTS enforce_contact_limit();
DROP FUNCTION IF EXISTS get_remaining_contact_slots(UUID);
DROP FUNCTION IF EXISTS get_member_contacts_with_limit(UUID);
*/

