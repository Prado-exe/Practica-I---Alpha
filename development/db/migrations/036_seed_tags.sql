
INSERT INTO tags (name) VALUES
    ('Presupuestos'),
    ('Accidentabilidad'),
    ('Aduana'),
    ('Alfabetizacion'),
    ('Análisis de precios'),
    ('Atenciones de Urgencia'),
    ('Mineria')
ON CONFLICT (name) DO NOTHING;