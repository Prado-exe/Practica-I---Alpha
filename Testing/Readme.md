# QA Environment - Testing/Proyecto

Este directorio contiene el entorno de pruebas automatizadas (QA) del proyecto, configurado con **Docker**, **Next.js/React**, **PostgreSQL** y **Playwright**.

## Inicio Rápido

Para levantar todo el entorno, ejecuta el siguiente comando en la raíz de esta carpeta:

```bash
docker compose up -d --build
```

Esto iniciará los siguientes servicios:
- **Frontend** (Vite/React) en `http://localhost:5173`
- **Backend** (Node.js) en `http://localhost:3000`
- **PostgreSQL** en `localhost:5432`
- **Playwright** (Contenedor de pruebas en reposo)

---

## Estructura del Proyecto

```text
Testing/Proyecto/
├── backend/            # Código fuente del servidor
├── frontend/           # Código fuente de la interfaz de usuario
├── tests/              # Pruebas automatizadas de Playwright (.spec.js)
├── postgres_data/      # Datos persistentes de la base de datos (Postgres)
├── Docker-compose.yml  # Orquestación de servicios
├── Dockerfile          # Imagen base para el entorno de desarrollo
├── playwright.config.js # Configuración de Playwright
└── package.json        # Dependencias de testing y scripts
```
---
<img width="296" height="656" alt="image" src="https://github.com/user-attachments/assets/8830fb94-6cce-4512-93e5-28f387e4793e" />
---
---

## Configuración Docker

### Dockerfile
El `Dockerfile` en la raíz de `Testing/Proyecto` está diseñado para crear un entorno de desarrollo consistente. 
- Utiliza `node:20-alpine` por su ligereza.
- Instala las dependencias definidas en el `package.json` raíz.
- Expone el puerto `5173` para el servidor de desarrollo.

### Docker Compose
El `Docker-compose.yml` gestiona 4 servicios principales:
1.  **frontend**: Construye y sirve la app de React. Usa volúmenes para reflejar cambios en tiempo real.
2.  **backend**: Serve el API de la aplicación.
3.  **postgres**: Base de datos relacional. Persiste los datos en la carpeta local `./postgres_data`.
4.  **playwright-qa**: Un contenedor especializado que ya incluye todos los navegadores necesarios para ejecutar pruebas E2E.

---

## Ejecución de Tests (Playwright)

Para ejecutar las pruebas dentro del contenedor de QA:

### 1. Ejecutar todos los tests
```bash
docker compose exec playwright-qa npm test
```

### 2. Ver reporte de resultados
Si hay fallos o quieres ver el detalle visual, ejecuta:
```bash
docker compose exec playwright-qa npm run report
```
Luego abre `http://localhost:36575` en tu navegador.

---

## Notas de Desarrollo

- **Persistencia de Datos**: Los datos de Postgres se guardan en `./postgres_data`. Si deseas resetear la base de datos, puedes borrar esta carpeta (con los contenedores apagados).
- **Variables de Entorno**: El frontend utiliza `VITE_API_URL` para comunicarse con el backend. En este entorno de QA, está configurado para apuntar a `http://localhost:3000` (acceso directo desde el navegador).

