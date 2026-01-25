# Entorno de Desarrollo - nombre-del-proyecto

Este directorio contiene el entorno de desarrollo local, configurado para facilitar el Hot Reloading y la sincronización entre el código fuente y los contenedores Docker.

## Inicio Rápido

Para levantar el entorno de desarrollo, ejecuta:

```bash
docker compose up --build
```

Esto iniciará los servicios en modo interactivo:
- **Frontend** (Vite/React): `http://localhost:5173`
- **Backend** (Node.js): `http://localhost:3000`
- **Postgres**: `localhost:5432`

---

## Estructura del Proyecto

```text
development/nombre-del-proyecto/
├── backend/            # API Node.js/Express
├── frontend/           # App React + Vite
│   ├── src/            # Código fuente UI
│   ├── public/         # Archivos estáticos
│   └── vite.config.js  # Configuración de compilación
├── dist/               # Producción (generado por build)
├── postgres_data/      # Base de datos persistente (Dev)
└── Docker-compose.yml  # Configuración de orquestación local
```

---

## Configuración Docker

### Frontend (Desarrollo)
- El contenedor monta el volumen local `./frontend` hacia `/app`.
- Esto permite que cualquier cambio que hagas en el código de React se refleje automáticamente (**HMR**) sin reiniciar Docker.
- Usa el puerto `5173`.

### Backend (Desarrollo)
- Monta `./backend` hacia `/app`.
- Depende del servicio `postgres`.
- Conectado a la red `dev-net`.

### Base de Datos
- **Postgres**: Imagen versión 16.
- Los datos se guardan en la carpeta local `./postgres_data` para que no se pierdan al apagar los contenedores.

---

## Proceso de Build (Producción)

Si deseas generar los archivos para llevar a producción (`Deployment`), debes generar el build del frontend:

1. Entra a la carpeta frontend:
   ```bash
   cd frontend
   ```
2. Ejecuta el build:
   ```bash
   npm run build
   ```
3. Los archivos se generarán en la carpeta `../dist/`.

> [!NOTE]
> La carpeta `dist` resultante es la que debe copiarse a la carpeta de `Deployment` para la puesta en marcha final.

---

## Notas Adicionales

- **Limpieza**: Si deseas resetear los datos de desarrollo, puedes borrar la carpeta `postgres_data` y volver a ejecutar el docker compose.
- **Variables de Entorno**: El frontend en desarrollo usa `http://localhost:3000` como base para las peticiones al API.
