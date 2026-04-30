-- Script para poblar la tabla file_formats con los formatos permitidos
-- Incluye los MIME types estándar para facilitar las descargas HTTP
-- ON CONFLICT (format_code) DO NOTHING asegura la idempotencia del script

INSERT INTO file_formats (format_code, format_name, mime_type) VALUES
    ('csv', 'CSV (Valores separados por comas)', 'text/csv'),
    ('doc', 'Microsoft Word (DOC)', 'application/msword'),
    ('docx', 'Microsoft Word (DOCX)', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    ('dta', 'Stata Data', 'application/x-stata'),
    ('html', 'HTML (Página Web)', 'text/html'),
    ('ipynb', 'Jupyter Notebook', 'application/x-ipynb+json'),
    ('jpeg', 'Imagen JPEG', 'image/jpeg'),
    ('jpg', 'Imagen JPG', 'image/jpeg'),
    ('json', 'JSON', 'application/json'),
    ('kml', 'Google Earth KML', 'application/vnd.google-earth.kml+xml'),
    ('kmz', 'Google Earth KMZ', 'application/vnd.google-earth.kmz'),
    ('ods', 'OpenDocument Spreadsheet', 'application/vnd.oasis.opendocument.spreadsheet'),
    ('parquet', 'Apache Parquet', 'application/vnd.apache.parquet'),
    ('pdf', 'Documento PDF', 'application/pdf'),
    ('powerbi', 'Power BI (PBIX)', 'application/pbix'),
    ('rar', 'Archivo Comprimido RAR', 'application/vnd.rar'),
    ('rdata', 'R Workspace', 'application/x-rlang-transport'),
    ('sav', 'SPSS Data', 'application/x-spss-sav'),
    ('shp', 'ESRI Shapefile', 'application/vnd.shp'),
    ('txt', 'Texto Plano', 'text/plain'),
    ('url', 'Enlace Web', 'text/uri-list'),
    ('wms', 'Web Map Service', 'application/vnd.ogc.wms_xml'),
    ('xls', 'Microsoft Excel (XLS)', 'application/vnd.ms-excel'),
    ('xlsx', 'Microsoft Excel (XLSX)', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    ('xml', 'XML', 'application/xml'),
    ('zip', 'Archivo Comprimido ZIP', 'application/zip'),
    ('png', 'Imagen PNG', 'image/png')
ON CONFLICT (format_code) DO NOTHING;