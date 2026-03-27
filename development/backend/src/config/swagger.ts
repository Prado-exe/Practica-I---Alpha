
import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Nativa Documentada',
      version: '1.0.0',
      description: 'Documentación OpenAPI generada en Node.js puro.',
    },
    servers: [
      {
        url: 'http://localhost:3000', // El puerto de tu servidor nativo
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // 📂 Rutas donde escribiremos los comentarios. Ajusta según tus carpetas.
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], 
};

// Generamos el JSON de la especificación
export const swaggerSpec = swaggerJSDoc(options);