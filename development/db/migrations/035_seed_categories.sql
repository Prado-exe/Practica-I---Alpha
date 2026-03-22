
INSERT INTO categories (code, name, description) VALUES
    ('ciencia_innovacion_tecnologia', 'Ciencia, Innovación y Tecnología', NULL),
    ('economia_empresas_finanzas', 'Economía, Empresas y Finanzas', NULL),
    ('gobierno_politica_sector_publico', 'Gobierno, Política y Sector Público', NULL),
    ('sociedad_comunidad_cultura', 'Sociedad, Comunidad y Cultura', NULL),
    ('educacion_deportes', 'Educación y Deportes', NULL),
    ('trabajo_empleo', 'Trabajo y Empleo', NULL),
    ('salud', 'Salud', NULL),
    ('justicia_seguridad', 'Justicia y Seguridad', NULL),
    ('medio_ambiente_energia', 'Medio Ambiente y Energía', NULL),
    ('agricultura_alimentacion', 'Agricultura y Alimentación', NULL),
    ('industria_produccion', 'Industria y Producción', NULL),
    ('transporte_movilidad', 'Transporte y Movilidad', NULL),
    ('geografia_territorio', 'Geografía y Territorio', NULL),
    ('turismo_recreacion', 'Turismo y Recreación', NULL),
    ('comunicaciones', 'Comunicaciones', NULL)
ON CONFLICT (code) DO NOTHING;