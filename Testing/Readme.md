# Documentación del Entorno de QA (Playwright)

Este archivo describe la configuración del entorno de Quality Assurance (QA) definido en `Docker-compose_qa.yml`. Este entorno replíca la arquitectura de desarrollo pero añade herramientas específicas para pruebas de extremo a extremo (E2E).

## Cómo Iniciar el Entorno QA

Para levantar este entorno específico, debes usar el flag `-f` para seleccionar el archivo compose correcto:

```bash
docker compose -f Docker-compose_qa.yml up --build
```

Esto levantará los siguientes contenedores en la red `qa-net`:
- `frontend-qa`
- `backend-qa`
- `postgres-qa`
- `playwright-qa`

---

## Arquitectura de Servicios

### 1. Aplicación Completa (Frontend + Backend + DB)
El entorno levanta una instancia completa de la aplicación para que las pruebas tengan un objetivo real contra el cual ejecutarse.
- **Frontend**: Accesible internamente en `http://frontend:5173`.
- **Backend**: Accesible internamente en `http://backend:3000`.
- **Postgres**: Base de datos dedicada para pruebas (volumen `./postgres_data_qa`).

### 2. Playwright (`playwright-qa`)
Este es el contenedor principal para la ejecución de pruebas.

* **Imagen**: `mcr.microsoft.com/playwright:v1.57.0-jammy` (Incluye navegadores y dependencias de Playwright).
* **Volumen**: Monta el directorio actual `.` en `/app`. Esto permite que el contenedor acceda a tus scripts de prueba locales.
* **Network**: Está en la misma red `qa-net`, por lo que puede "ver" al frontend usando el nombre del servicio `frontend`.
* **Comando**: `sleep infinity`. El contenedor se inicia y se queda esperando. No ejecuta pruebas automáticamente al arrancar, lo que te permite entrar en él y ejecutarlas manualmente cuando desees.

---

## Cómo Ejecutar Pruebas

Una vez que el entorno está arriba (`docker compose up`), sigue estos pasos para correr tus tests:

1. **Entrar al contenedor de Playwright:**
   Abrir una nueva terminal y ejecutar:
   ```bash
   docker exec -it playwright-qa /bin/bash
   ```

2. **Instalar dependencias (si es la primera vez):**
   Dentro del contenedor:
   ```bash
   npm install
   ```

3. **Instalar navegadores de Playwright (si es necesario):**
   ```bash
   npx playwright install
   ```

4. **Ejecutar los tests:**
   ```bash
   npx playwright test
   ```

## Notas Importantes
- **Base URL**: El contenedor de Playwright tiene configurada la variable `BASE_URL=http://frontend:5173`. Asegúrate de usar esta variable en tus tests o configurar `playwright.config.js` para usarla.
- **Datos de Prueba**: La base de datos `postgres-qa` guarda sus datos en una carpeta separada (`postgres_data_qa`) para no interferir con tus datos de desarrollo.
