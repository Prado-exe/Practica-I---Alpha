INSERT INTO licenses (code, name, description, is_active) VALUES
('cc-by', 'Creative Commons Attribution', 'Permite a otros distribuir, mezclar, ajustar y construir a partir de su obra, incluso con fines comerciales, siempre que le sea reconocida la autoría original.', TRUE),
('cc-zero', 'Creative Commons CCZero', 'Dedicación a Dominio Público. Permite renunciar a todos los derechos de autor.', TRUE),
('other-open', 'Otra (Abierta)', 'Licencia abierta no especificada en el estándar CC.', TRUE),
('not-specified', 'No se especificó la licencia', 'El autor o institución no ha definido explícitamente una licencia de uso para este recurso.', TRUE)
ON CONFLICT (code) DO NOTHING;