import path from "path";
import { fileURLToPath } from "url";
import swaggerJsdoc from "swagger-jsdoc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "THINKTRACE API",
      version: "1.0.0",
      description: "API Documentation for THINKTRACE Backend",
    },

    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Development Server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [
    path.join(__dirname, "routes", "*.js").replace(/\\/g, '/'),
    path.join(__dirname, "controllers", "*.js").replace(/\\/g, '/'),
  ],
};

export default swaggerJsdoc(options);