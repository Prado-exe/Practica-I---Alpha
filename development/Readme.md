# Documentación del Proyecto Docker (React + Node + Postgres)

Este repositorio contiene la configuración para un entorno de desarrollo contenerizado. A continuación se detalla la arquitectura, los componentes de Docker y la estructura correcta del proyecto.

## Estructura del Proyecto

Para que la construcción de Docker funcione correctamente, el proyecto debe seguir esta estructura de archivos. Es **crítico** que la carpeta `public` (con `vite.svg` dentro) esté ubicada dentro de `frontend/` y no en la raíz.

```text
.
├── Docker-compose.yml      # Orquestación de contenedores
├── Readme.md               # Esta documentación
├── backend/                # Código del Backend (Node.js/Express)
│   ├── Dockerfile          # Definición de imagen del backend
│   ├── package.json        # Dependencias (express, pg, cors)
│   └── src/
│       └── index.js        # Punto de entrada del servidor
├── frontend/               # Código del Frontend (React + Vite)
│   ├── Dockerfile          # Definición de imagen del frontend
│   ├── package.json        # Dependencias de React/Vite
│   ├── vite.config.js      # Configuración de Vite
│   ├── public/             # Archivos estáticos públicos
│   │   └── vite.svg        # Logo de Vite (importante para el build)
│   └── src/
│       ├── App.jsx         # Componente principal
│       └── main.jsx        # Punto de entrada de React
└── postgres_data/          # Persistencia de datos (generado automáticamente)
```

---

## Docker Compose

El archivo `Docker-compose.yml` orquesta 3 servicios conectados a través de la red `dev-net`.

### 1. Servicio `frontend`
- **Contexto de Build**: Carpeta `./frontend`.
- **Puerto**: Expone el puerto `5173` al host.
- **Volúmenes**:
  - `./frontend:/app`: Sincroniza el código local con el contenedor.
  - `/app/node_modules`: Evita que `node_modules` del host sobrescriba el del contenedor.
- **Variables de Entorno**:
  - `VITE_API_URL`: Apunta a `http://localhost:3000
- **Comando**: `npm run dev -- --host 0.0.0.0`

### 2. Servicio `backend`
- **Contexto de Build**: Carpeta `./backend`.
- **Puerto**: Expone el puerto `3000` al host.
- **Volúmenes**:
  - `./backend:/app`
- **Dependencia**: Espera a que `postgres` esté listo antes de iniciar.
- **Conexión a BD**: Se conecta al host `postgres` (nombre del servicio) en el puerto `5432`.

### 3. Servicio `postgres`
- **Imagen**: `postgres:16`.
- **Puertos**: Expone el puerto estándar `5432`.
- **Volúmenes**: `./postgres_data` mapeado a `/var/lib/postgresql/data` para persistencia de datos (la base de datos no se borra al detener el contenedor).
- **Credenciales**: Configuradas en `environment` (Usuario: `user`, Pass: `password`, DB: `appdb`).

---

## Explicación de Dockerfiles

### Frontend (`frontend/Dockerfile`)
```dockerfile
FROM node:20            # Imagen base de Node.js versión 20
WORKDIR /app            # Directorio de trabajo dentro del contenedor
COPY package*.json ./   # Copia archivos de dependencias primero (para optimizar caché)
RUN npm install         # Instala dependencias del frontend
COPY . .                # Copia el resto del código fuente
EXPOSE 5173             # Documenta que el contenedor usa el puerto 5173
# El comando de inicio se define en docker-compose (npm run dev)
```

### Backend (`backend/Dockerfile`)
```dockerfile
FROM node:20            # Misma imagen base para consistencia
WORKDIR /app
COPY package*.json ./   # Copia manifiestos de dependencias
RUN npm install         # Instala express, pg, cors, etc.
COPY . .                # Copia el código fuente (src/index.js, etc.)
EXPOSE 3000             # Documenta el puerto de la API
CMD ["npm", "run", "dev"] # Comando por defecto al iniciar
```

---

## Cómo Iniciar

1. Asegúrate de tener la estructura correcta (especialmente `frontend/public`).
2. Ejecuta el comando:
   ```bash
   docker compose up --build
   ```
3. Accede a:
   - **Frontend**: http://localhost:5173
   - **Backend Status**: http://localhost:3000/api/status



