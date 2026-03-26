\echo 'Iniciando migraciones...'

BEGIN;

\i /migrations/034_file_formats.sql
\i /migrations/002_create_roles.sql
\i /migrations/003_create_permissions.sql
\i /migrations/019_create_categories.sql
\i /migrations/020_create_licenses.sql
\i /migrations/024_create_tags.sql
\i /migrations/029_create_ods_objectives.sql

\i /migrations/005_create_accounts.sql
\i /migrations/011_create_role_permissions.sql
\i /migrations/001_create_aws_file_references.sql
\i /migrations/004_create_institutions.sql

\i /migrations/013_seed_roles.sql
\i /migrations/014_seed_permissions.sql
\i /migrations/015_seed_role_permissions.sql

\i /migrations/006_create_auth_sessions.sql
\i /migrations/007_create_verification_codes.sql
\i /migrations/008_create_password_reset_tokens.sql
\i /migrations/009_create_security_logs.sql

\i /migrations/021_create_dataset.sql
\i /migrations/022_create_dataset_account_permission.sql
\i /migrations/023_create_dataset_requests.sql
\i /migrations/025_dataset_tags.sql
\i /migrations/026_dataset_files.sql
\i /migrations/027_dataset_stats.sql
\i /migrations/028_dataset_events.sql

\i /migrations/030_create_news_posts.sql
\i /migrations/031_create_news_post_files.sql

\i /migrations/032_create_contact_messages.sql
\i /migrations/033_create_contact_message_files.sql

\i /migrations/035_seed_categories.sql
\i /migrations/036_seed_tags.sql
\i /migrations/037_seed_file_formats.sql
\i /migrations/038_seed_ods_objectives.sql
\i /migrations/039_seed_licenses.sql
COMMIT;

\echo 'Migraciones completadas.'