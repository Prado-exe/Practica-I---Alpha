# Entorno de Producción - Deployment

Este directorio contiene la configuración final para desplegar la aplicación utilizando los artefactos generados en desarrollo. A diferencia de desarrollo, aquí no se utiliza Hot Reloading; se prioriza la estabilidad y el rendimiento sirviendo archivos estáticos.

## Inicio Rápido

Para poner en marcha el entorno de producción, asegúrate de haber seguido los pasos de **Preparación de Archivos** y luego ejecuta:

```bash
docker compose up -d --build
```

---

## Preparación de Archivos (Paso Obligatorio)

Para que este entorno funcione, debes "pasar" los archivos desde el entorno de desarrollo a esta carpeta siguiendo estos pasos:

### 1. Frontend (Carpeta `dist`)
- Realiza el build en desarrollo (`npm run build` dentro de la carpeta frontend).
- Copia la carpeta `dist` resultante (que contiene `index.html` y `assets`) a la raíz de este directorio (`Deployment/dist`).

### 2. Backend (Carpeta `backend-src`)
- Crea una carpeta llamada `backend-src` dentro de este directorio.
- Copia el código fuente de tu backend (archivo `package.json` y la carpeta `src`) dentro de `Deployment/backend-src/`.
- El Dockerfile del backend ya está configurado para instalar solo las dependencias de producción.

### 3. Configuración de Entorno
- Asegúrate de tener un archivo `.env` en la raíz de `Deployment/` con las credenciales de la base de datos:
  ```env
  DB_HOST_POSTGRES=postgres
  DB_USER=user
  DB_PASS=password
  DB_NAME=appdb
  POSTGRES_USER=user
  POSTGRES_PASSWORD=password
  POSTGRES_DB=appdb
  ```

---

## Estructura de la Carpeta Deployment

```text
Deployment/
├── .env                # Variables de entorno de producción
├── Docker-compose.yml  # Orquestador de producción
├── dist/               # Archivos estáticos del frontend (Copiados)
├── backend-src/        # Código fuente del backend (Copiado)
│   └── Dockerfile      # Configuración de imagen de producción
├── nginx/              # Configuración del servidor Web / Proxy
│   ├── Dockerfile      # Genera la imagen personalizada de Nginx
│   └── default.conf    # Reglas de ruteo (Frontend + API)
└── postgres_data/      # Datos persistentes de la base de datos
```
---
<img width="286" height="389" alt="image" src="https://github.com/user-attachments/assets/6df1e8a7-56e2-4ea3-b816-284461981945" />
---
---

## Arquitectura de Red

El sistema utiliza **Nginx** como puerta de entrada única (puerto 80):
- **Tráfico Web (`/`)**: Nginx sirve directamente los archivos de la carpeta `dist`.
- **Tráfico API (`/api/`)**: Nginx actúa como Proxy Reverso y redirige las peticiones al contenedor de `backend` en el puerto 3000.

Esto permite que la aplicación sea más segura y eficiente al no exponer los servicios internos directamente al exterior.

---

## Notas de Mantenimiento

- **Actualizaciones**: Cada vez que realices cambios en el código, recuerda regenerar el `dist` en desarrollo y volver a copiarlo aquí antes de hacer un `docker compose up --build`.
- **Logs**: Puedes monitorear el estado de los servicios con `docker compose logs -f`.

