-- Flyway Callback: afterMigrate
-- Automatically enforces least-privilege on audit_logs in every environment after migration or baseline.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${app_role}') THEN
    RAISE EXCEPTION 'Role % does not exist; cannot enforce audit_logs least privilege', '${app_role}';
  END IF;

  IF to_regclass('public.audit_logs') IS NULL THEN
    RAISE EXCEPTION 'Table public.audit_logs does not exist; cannot enforce audit_logs least privilege';
  END IF;

  EXECUTE format('REVOKE ALL ON TABLE public.audit_logs FROM %I', '${app_role}');
  EXECUTE format('GRANT SELECT, INSERT ON TABLE public.audit_logs TO %I', '${app_role}');
END
$$;

