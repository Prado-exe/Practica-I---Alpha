# Entorno de Despliegue (Deployment)

Este directorio contiene la configuración de Docker lista para producción de la aplicación. Está diseñado para ser seguro, eficiente y escalable, utilizando Nginx como proxy inverso y construcciones multi-etapa para imágenes de contenedores optimizadas.

## Visión General de la Arquitectura

El siguiente diagrama ilustra el flujo de solicitudes y la interacción entre servicios dentro de la red Docker.

```text
      +-----------------------+
      |   Navegador Cliente   |
      +-----------+-----------+
                  |
           Puerto HTTP 80
                  |
                  v
+---------------------------------------------+
|                 Red Docker                  |
|                                             |
|        +---------------------+              |
|        |     Proxy Nginx     |              |
|        +---------+-----------+              |
|                  |                          |
|       / (Assets) |   /api/* (Datos)         |
|      v           v                          |
| +----------+  +-----------+                 |
| | Frontend |  |  Backend  |                 |
| +----------+  +-----+-----+                 |
|                     |                       |
|                     +-------+               |
|                     |       |               |
|              +------v-+  +--v----+          |
|              |Postgres|  | MySQL |          |
|              +--------+  +-------+          |
|                                             |
+---------------------------------------------+
```

## Estructura de Directorios

```text
Deployment/
├── backend/            # Dockerfile del Backend y contexto del código fuente
├── frontend/           # Dockerfile del Frontend y contexto del código fuente
├── nginx/              # Configuración Global del Proxy Nginx
├── Docker-compose.yml  # Orquestación de Producción
└── .env.production     # Variables de Entorno (Requerido)
```

## Prerrequisitos

Antes de desplegar, asegúrate de cumplir con los siguientes requisitos:

1.  **Código Fuente**: El código fuente completo debe estar presente en los contextos de construcción designados:
    *   Código del Frontend en `Deployment/frontend/`
    *   Código del Backend en `Deployment/backend/`
2.  **Configuración del Entorno**: Crea un archivo `.env.production` en este directorio.

## Configuración

Crea un archivo `.env.production` con las siguientes claves. Asegúrate de que estas contraseñas sean seguras para un entorno de producción.

```ini
# Credenciales de Base de Datos
POSTGRES_USER=usuario_admin
POSTGRES_PASSWORD=contraseña_segura
POSTGRES_DB=produccion_db

MYSQL_ROOT_PASSWORD=contraseña_root_segura
MYSQL_DATABASE=produccion_db
MYSQL_USER=usuario_admin
MYSQL_PASSWORD=contraseña_segura
```

## Pasos de Despliegue

1.  **Construir e Iniciar Servicios**
    Ejecuta el siguiente comando para construir las imágenes optimizadas e iniciar los contenedores en modo "detached":

    ```bash
    docker compose up -d --build
    ```

2.  **Verificar Estado**
    Comprueba que todos los contenedores se estén ejecutando y estén saludables:

    ```bash
    docker ps
    ```

3.  **Acceder a la Aplicación**
    La aplicación será accesible en `http://localhost` (o la dirección IP de tu servidor) en el puerto 80.

## Detalles de los Servicios

| Servicio | Puerto Interno | Puerto Externo | Descripción |
| :--- | :--- | :--- | :--- |
| **Nginx** | 80 | **80** | Punto de entrada / Proxy Inverso |
| **Frontend** | 80 | - | App React (Servida por Nginx interno) |
| **Backend** | 3000 | - | API Node.js |
| **PostgreSQL**| 5432 | - | Base de Datos Relacional |
| **MySQL** | 3306 | - | Base de Datos Relacional |

**Nota**: Los puertos de las bases de datos NO están expuestos al sistema host por razones de seguridad. Solo son accesibles por el servicio Backend dentro de la red Docker.
