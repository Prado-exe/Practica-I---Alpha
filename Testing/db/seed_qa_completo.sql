-- ============================================================================
-- 1. CREACIÓN / ACTUALIZACIÓN DE USUARIOS QA
-- ============================================================================
INSERT INTO accounts (
    role_id, 
    username, 
    email, 
    password_hash, 
    full_name, 
    account_status, 
    email_verified
) VALUES 
(1, 'qa_registered', 'qa_registered@qa.local', '$2b$12$F.U9JA2e410hvptPRJRAvOClym4ayB6Nrv5jw/n6KQIE1PQd.eLci', 'QA Registered User', 'active', TRUE),
(2, 'qa_data', 'qa_data@qa.local', '$2b$12$F.U9JA2e410hvptPRJRAvOClym4ayB6Nrv5jw/n6KQIE1PQd.eLci', 'QA Data Admin', 'active', TRUE),
(3, 'qa_useradmin', 'qa_useradmin@qa.local', '$2b$12$F.U9JA2e410hvptPRJRAvOClym4ayB6Nrv5jw/n6KQIE1PQd.eLci', 'QA User Admin', 'active', TRUE),
(4, 'qa_super', 'qa_super@qa.local', '$2b$12$F.U9JA2e410hvptPRJRAvOClym4ayB6Nrv5jw/n6KQIE1PQd.eLci', 'QA Super Admin', 'active', TRUE)
ON CONFLICT (email) DO UPDATE SET 
    role_id = EXCLUDED.role_id,
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    account_status = EXCLUDED.account_status,
    email_verified = EXCLUDED.email_verified;

-- ============================================================================
-- 2. RED DE SEGURIDAD PARA CATEGORÍAS Y LICENCIAS
-- ============================================================================
-- Insertamos datos dummy solo si las tablas están completamente vacías
INSERT INTO categories (name, description)
SELECT 'Categoría QA', 'Categoría generada automáticamente para pruebas'
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

INSERT INTO licenses (name, description)
SELECT 'Licencia QA', 'Licencia generada automáticamente para pruebas'
WHERE NOT EXISTS (SELECT 1 FROM licenses LIMIT 1);


-- ============================================================================
-- 3. GENERACIÓN MASIVA DE DATASETS (Asignados al Super Admin)
-- ============================================================================
DO $$
DECLARE
    v_dataset_id BIGINT;
    v_aws_file_id BIGINT;
    
    v_account_id BIGINT;
    v_category_id BIGINT;
    v_license_id BIGINT;
    v_file_format_id SMALLINT;
    
    i INTEGER;
    j INTEGER;
    v_num_files INTEGER;
BEGIN
    -- Obtenemos el ID exacto del Super Admin recién creado/actualizado
    SELECT account_id INTO v_account_id FROM accounts WHERE email = 'qa_super@qa.local' LIMIT 1;
    
    -- Obtenemos la primera categoría y licencia disponibles
    SELECT category_id INTO v_category_id FROM categories LIMIT 1;
    SELECT license_id INTO v_license_id FROM licenses LIMIT 1;
    
    -- Buscamos el formato CSV (si no existe, forzamos un 1 para evitar crasheos)
    SELECT file_format_id INTO v_file_format_id FROM file_formats WHERE mime_type = 'text/csv' LIMIT 1;
    IF v_file_format_id IS NULL THEN
        v_file_format_id := 1; 
    END IF;

    -- Ciclo para crear 50 datasets
    FOR i IN 1..50 LOOP
        INSERT INTO datasets (
            owner_account_id, category_id, license_id, title, summary, 
            description, dataset_status, access_level, creation_date
        ) VALUES (
            v_account_id, v_category_id, v_license_id, 
            'Dataset de Prueba QA masiva #' || i, 
            'Resumen para el dataset masivo ' || i, 
            'Descripción detallada generada para pruebas de carga. Dataset ' || i, 
            'published', 'public', NOW()
        ) RETURNING dataset_id INTO v_dataset_id;

        -- Calculamos entre 1 y 4 archivos por dataset
        v_num_files := (i % 4) + 1;

        FOR j IN 1..v_num_files LOOP
            -- Inserción en AWS File References apuntando a MinIO
            INSERT INTO aws_file_references (
                storage_key, file_url, file_format_id, file_size_bytes, 
                mime_type, file_category, owner_account_id
            ) VALUES (
                'uploads/qa-dataset-' || i || '-file-' || j || '.csv',
                'http://localhost:9000/observatorio-bucket/uploads/qa-dataset-' || i || '-file-' || j || '.csv',
                v_file_format_id, 1024, 'text/csv', 'dataset_source', v_account_id
            ) RETURNING aws_file_reference_id INTO v_aws_file_id;

            -- Inserción en la tabla relacional
            INSERT INTO dataset_files (
                dataset_id, aws_file_reference_id, file_role, display_name, 
                file_format, mime_type, file_size_bytes, is_primary
            ) VALUES (
                v_dataset_id, v_aws_file_id, 'source', 'qa-dataset-' || i || '-file-' || j || '.csv', 
                'csv', 'text/csv', 1024, (j = 1)
            );
        END LOOP;

        -- Registro del evento forense
        INSERT INTO dataset_events (dataset_id, actor_account_id, event_type, event_comment)
        VALUES (v_dataset_id, v_account_id, 'published', 'QA SQL Seeder: Creado con ' || v_num_files || ' archivos');
        
    END LOOP;
END $$;