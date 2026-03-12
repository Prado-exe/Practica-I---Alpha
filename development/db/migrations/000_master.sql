\echo 'Iniciando migraciones...'

BEGIN;

\i /migrations/001_create_aws_file_references.sql
\i /migrations/002_create_roles.sql
\i /migrations/003_create_permissions.sql
\i /migrations/004_create_institutions.sql
\i /migrations/005_create_accounts.sql
\i /migrations/006_create_auth_sessions.sql
\i /migrations/007_create_verification_codes.sql
\i /migrations/008_create_password_reset_tokens.sql
\i /migrations/009_create_security_logs.sql
\i /migrations/011_create_role_permissions.sql
\i /migrations/012_create_account_role_assignments.sql
\i /migrations/013_seed_roles.sql
\i /migrations/014_seed_permissions.sql
\i /migrations/015_seed_role_permissions.sql
\i /migrations/017_create_institution_dataset_account_permissions.sql

COMMIT;

\echo 'Migraciones completadas.'