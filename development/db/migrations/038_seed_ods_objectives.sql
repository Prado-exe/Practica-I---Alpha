INSERT INTO ods_objectives (objective_code, objective_name) VALUES
('ODS-01', 'Fin de la pobreza'),
('ODS-02', 'Hambre cero'),
('ODS-03', 'Salud y Bienestar'),
('ODS-04', 'Educacion de calidad'),
('ODS-05', 'Igualdad de genero'),
('ODS-06', 'Agua limpia y saneamiento'),
('ODS-07', 'Energia asequible y no contaminante'),
('ODS-08', 'Trabajo decente y crecimiento economico'),
('ODS-09', 'Industria, innovación e infraestructuras'),
('ODS-10', 'Reduccion de las desigualdades'),
('ODS-11', 'Ciudades y comunidades sostenibles'),
('ODS-12', 'Produccion y consumo responsable'),
('ODS-13', 'Accion por el clima'),
('ODS-14', 'Vida submarina'),
('ODS-15', 'Vida de ecosistemas terrestres'),
('ODS-16', 'Paz, justicia e instituciones solidas'),
('ODS-17', 'Alianza para lograr objetivos')
ON CONFLICT (objective_name) DO NOTHING;