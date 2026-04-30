INSERT INTO roles (code, name, description, is_system, is_active)
VALUES
    ('registered_user', 'Registered User', 'Authenticated end user with access to internal authorized content.', TRUE, TRUE),
    ('data_admin', 'Data Administrator', 'Manages datasets, metadata and validation processes.', TRUE, TRUE),
    ('user_admin', 'User Administrator', 'Manages users, roles and permissions.', TRUE, TRUE),
    ('super_admin', 'Super Administrator', 'Full system access, including security and general administration.', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;