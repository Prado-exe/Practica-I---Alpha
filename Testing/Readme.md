# Estructura de Carpetas  para el Proyecto

A continuación, se presenta una estructura de carpetas recomendada y profesional para el proyecto basado en **Vite, React, Playwright y Docker en conjunto a (mysql,mariadb,postgresql)**



#  QA Automation - React + Vite + Playwright + Docker

Este proyecto es un entorno de desarrollo y pruebas automatizadas (QA) que utiliza **React** con **Vite**, orquestado con **Docker** y testeado con **Playwright**.

##  Estructura del Proyecto
La organización del código sigue los estándares de mantenibilidad y escalabilidad:
* **/src**: Código fuente de la aplicación React (componentes, hooks, servicios).
* **/tests/e2e**: Pruebas de extremo a extremo (End-to-End) con Playwright.
* **/tests/integration**: Pruebas de integración de componentes.
* **Dockerfile & docker-compose.yml**: Configuración del entorno de contenedores.

##  Requisitos Previos
* Tener instalado **Docker** y **Docker Compose**.
* Node.js (opcional, para autocompletado en el editor).

# Ejecución de Pruebas de QA
Una vez que los contenedores estén corriendo, puedes ejecutar los tests de automatización con el siguiente comando:

* docker exec -it engine-qa npx playwright test

# Ver Reportes de Pruebas
Si quieres ver el reporte visual de los resultados:

docker exec -it engine-qa npx playwright show-report --host 0.0.0.0

## Estructura Recomendada

```
/project-root
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── playwright.config.ts
├── README.md
├── tsconfig.json
├── vite.config.ts
|
├── /dist
├── /node_modules
├── /public
|
├── /src
│   ├── /assets
│   │   ├── images
│   │   └── styles
│   │
│   ├── /components
│   │
│   ├── /hooks
│   │
│   ├── /pages
│   │
│   ├── /services
│   │
│   ├── /utils
│   │
│   ├── App.jsx
│
└── /tests
    ├── /e2e
    │   └── home.spec.ts
    └── /integration
        └── component.spec.ts

```

## Descripción de Directorios y Archivos Clave

### Archivos Raíz

| Archivo | Propósito |
| :--- | :--- |
| **`Dockerfile`** | Define la imagen de Docker para la aplicación. Contiene los pasos para instalar dependencias, copiar el código y ejecutar la aplicación en un entorno aislado. |
| **`docker-compose.yml`** | Orquesta los servicios de la aplicación (ej. la app de React y el motor de pruebas de Playwright). Facilita la ejecución del entorno completo con un solo comando. |
| **`.dockerignore`** | Excluye archivos y directorios (como `node_modules`) de ser copiados a la imagen de Docker, optimizando el proceso de build. |
| **`.gitignore`** | Especifica qué archivos y directorios deben ser ignorados por el control de versiones Git. |
| **`playwright.config.ts`** | Archivo de configuración para las pruebas de Playwright, donde se definen navegadores, `baseURL`, y otras opciones de testeo. |
| **`vite.config.ts`** | Configuración de Vite, el empaquetador y servidor de desarrollo. |
| **`package.json`** | Define los metadatos del proyecto, dependencias (React, Vite) y scripts (dev, build, test). |
| **`README.md`** | Documentación principal del proyecto. Debe incluir cómo instalar, configurar y ejecutar el proyecto. |
