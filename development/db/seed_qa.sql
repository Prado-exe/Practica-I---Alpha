-- seed_qa.sql

INSERT INTO accounts (
    role_id, 
    username, 
    email, 
    password_hash, 
    full_name, 
    account_status, 
    email_verified
) VALUES 
-- 1. Registered User (role_id: 1)
(1, 'qa_registered', 'qa_registered@qa.local', '$2b$12$F.U9JA2e410hvptPRJRAvOClym4ayB6Nrv5jw/n6KQIE1PQd.eLci', 'QA Registered User', 'active', TRUE),

-- 2. Data Administrator (role_id: 2)
(2, 'qa_data', 'qa_data@qa.local', '$2b$12$F.U9JA2e410hvptPRJRAvOClym4ayB6Nrv5jw/n6KQIE1PQd.eLci', 'QA Data Admin', 'active', TRUE),

-- 3. User Administrator (role_id: 3)
(3, 'qa_useradmin', 'qa_useradmin@qa.local', '$2b$12$F.U9JA2e410hvptPRJRAvOClym4ayB6Nrv5jw/n6KQIE1PQd.eLci', 'QA User Admin', 'active', TRUE),

-- 4. Super Administrator (role_id: 4)
(4, 'qa_super', 'qa_super@qa.local', '$2b$12$F.U9JA2e410hvptPRJRAvOClym4ayB6Nrv5jw/n6KQIE1PQd.eLci', 'QA Super Admin', 'active', TRUE)

-- Si el correo ya existe, forzamos la actualización de los datos para no tener errores
ON CONFLICT (email) DO UPDATE SET 
    role_id = EXCLUDED.role_id,
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    account_status = EXCLUDED.account_status,
    email_verified = EXCLUDED.email_verified;