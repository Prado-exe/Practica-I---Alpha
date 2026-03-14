
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.code IN (
    'portal_public.read',
    'catalog.read',
    'search.read',
    'visualization.read',
    'download.read',
    'history_versioning.read'
)
WHERE r.code = 'registered_user'
ON CONFLICT (role_id, permission_id) DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.code IN (
    'portal_public.read',
    'catalog.read',
    'catalog.write',
    'search.read',
    'visualization.read',
    'download.read',
    'data_management.read',
    'data_management.write',
    'data_management.delete',
    'metadata_management.read',
    'metadata_management.write',
    'metadata_management.delete',
    'data_validation.execute',
    'history_versioning.read',
    'activity_log.read_own'
)
WHERE r.code = 'data_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.code IN (
    'portal_public.read',
    'catalog.read',
    'search.read',
    'visualization.read',
    'download.read',
    'user_management.read',
    'user_management.write',
    'user_management.delete',
    'roles_permissions.read',
    'roles_permissions.write',
    'history_versioning.read',
    'activity_log.read'
)
WHERE r.code = 'user_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON TRUE
WHERE r.code = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;