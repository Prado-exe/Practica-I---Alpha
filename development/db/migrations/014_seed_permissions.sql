INSERT INTO permissions (code, module_code, resource, action, description, is_active)
VALUES
    ('portal_public.read',      'portal_public',      'portal_public',      'read',     'Read public portal content.', TRUE),

    ('catalog.read',            'catalog',            'catalog',            'read',     'Read data catalog.', TRUE),
    ('catalog.write',           'catalog',            'catalog',            'write',    'Create or edit catalog content.', TRUE),

    ('search.read',             'search',             'search',             'read',     'Use search and filtering.', TRUE),

    ('visualization.read',      'visualization',      'visualization',      'read',     'View data visualizations.', TRUE),

    ('download.read',           'download',           'download',           'read',     'Download allowed resources.', TRUE),

    ('user_management.read',    'user_management',    'user_management',    'read',     'Read users.', TRUE),
    ('user_management.write',   'user_management',    'user_management',    'write',    'Create or update users.', TRUE),
    ('user_management.delete',  'user_management',    'user_management',    'delete',   'Deactivate or delete users.', TRUE),

    ('roles_permissions.read',  'roles_permissions',  'roles_permissions',  'read',     'Read roles and permissions.', TRUE),
    ('roles_permissions.write', 'roles_permissions',  'roles_permissions',  'write',    'Manage roles and permissions.', TRUE),

    ('data_management.read',    'data_management',    'data_management',    'read',     'Read internal data management resources.', TRUE),
    ('data_management.write',   'data_management',    'data_management',    'write',    'Create or update datasets.', TRUE),
    ('data_management.delete',  'data_management',    'data_management',    'delete',   'Delete datasets.', TRUE),

    ('metadata_management.read',   'metadata_management', 'metadata_management', 'read',   'Read metadata management resources.', TRUE),
    ('metadata_management.write',  'metadata_management', 'metadata_management', 'write',  'Create or update metadata.', TRUE),
    ('metadata_management.delete', 'metadata_management', 'metadata_management', 'delete', 'Delete metadata.', TRUE),

    ('data_validation.execute', 'data_validation',    'data_validation',    'execute',  'Execute data validation processes.', TRUE),

    ('history_versioning.read', 'history_versioning', 'history_versioning', 'read',     'Read history and versioning data.', TRUE),

    ('activity_log.read_own',   'activity_log',       'activity_log',       'read_own', 'Read own activity log.', TRUE),
    ('activity_log.read',       'activity_log',       'activity_log',       'read',     'Read general activity logs.', TRUE),

    ('security.read',           'security',           'security',           'read',     'Read security-related information.', TRUE),

    ('admin_general.manage',    'admin_general',      'admin_general',      'manage',   'Manage global system administration.', TRUE)
ON CONFLICT (code) DO NOTHING;