# README – Entorno de Desarrollo con Docker (React + Vite + DBs)

## Descripción General

Este repositorio contiene la configuración necesaria para levantar un **entorno de desarrollo** usando **Docker Compose**, el cual incluye:

* Un **frontend en React + Vite**
* Un contenedor de **PostgreSQL**
* Un contenedor de **MySQL**

**Importante:** el proyecto **React + Vite debe crearse previamente de forma local**. Docker **no crea el proyecto**, solo lo **ejecuta y sirve** dentro de un contenedor.

---

## Requisitos Previos

Antes de usar este `docker-compose.yml`, debes tener instalado:

* Docker
* Docker Compose
* Node.js (solo para crear el proyecto inicialmente)

---

## Paso 1: Crear el proyecto React + Vite (previo a Docker)

Este paso se realiza **una sola vez**, fuera de Docker.

```bash
npm create vite@latest frontend
cd frontend
npm install
```

Asegúrate de que el proyecto tenga al menos:

* `package.json`
* `node_modules/` (opcional, Docker lo recrea)
* `vite.config.js`

Una vez creado el proyecto, copia o coloca el `docker-compose.yml` y el `Dockerfile` **en la raíz del proyecto React**.

---


## Paso 2: Levantar el entorno con Docker

Desde la raíz del proyecto:

```bash
docker compose up --build
```

Esto levantará **3 contenedores**:

| Servicio | Contenedor   | Puerto Host |
| -------- | ------------ | ----------- |
| Frontend | frontend-dev | 5173        |
| Postgres | postgres-dev | 5432        |
| MySQL    | mysql-dev    | 3308        |

---

## Acceso al Frontend

Una vez levantado el entorno, accede desde el navegador a:

```
http://localhost:5173
```

El servidor Vite se ejecuta con:

```bash
npm run dev -- --host 0.0.0.0
```

Esto permite el acceso desde fuera del contenedor.

---

## Variables de Entorno

### Recomendación de Seguridad (Muy Importante)

Se recomienda **no definir credenciales sensibles directamente en el `docker-compose.yml`**. Todas las credenciales de acceso a bases de datos (usuarios, contraseñas, nombres de BD, puertos sensibles, etc.) **deben declararse mediante variables de entorno**, idealmente usando un archivo `.env`.

Esto mejora significativamente la **seguridad**, **portabilidad** y **mantenibilidad** del proyecto.

**Buenas prácticas:**

* Usar un archivo `.env` (no versionado en Git)
* Referenciar las variables desde `docker-compose.yml`
* Definir valores distintos para desarrollo, testing y producción

Ejemplo de archivo `.env`:

```env
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=appdb

MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=appdb
MYSQL_USER=user
MYSQL_PASSWORD=password
```

Ejemplo de uso en `docker-compose.yml`:

```yaml
environment:
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  POSTGRES_DB: ${POSTGRES_DB}
```

**Nunca subas el archivo `.env` al repositorio**. Agrégalo a `.gitignore`.

---

## Variables de Entorno

El frontend recibe la siguiente variable:

```env
VITE_API_URL=http://localhost:3000
```

Esta variable puede ser utilizada dentro de React como:

```js
import.meta.env.VITE_API_URL
```

---

## Base de Datos – PostgreSQL

**Credenciales:**

* Usuario: `user`
* Password: `password`
* Base de datos: `appdb`
* Puerto: `5432`

**Persistencia:**

```text
./postgres_data
```

---

## Base de Datos – MySQL

**Credenciales:**

* Usuario: `user`
* Password: `password`
* Root password: `rootpassword`
* Base de datos: `appdb`
* Puerto host: `3308`

**Persistencia:**

```text
./mysql_data
```

---

## Red Docker

Todos los servicios comparten la red:

```text
dev-net
```

Esto permite que los contenedores se comuniquen entre sí usando los nombres:

* `postgres`
* `mysql`
* `frontend`

---

## Detener el entorno

```bash
docker compose down
```

Para eliminar también los volúmenes:

```bash
docker compose down -v
```

---



