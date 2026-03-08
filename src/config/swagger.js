import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Recouvra+ API",
      version: "1.0.0",
      description: "API de gestion du recouvrement",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterInput: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", example: "123456" },
            role: { type: "string", example: "agent" },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", example: "123456" },
          },
        },
        UpdateProfileInput: {
          type: "object",
          properties: {
            name: { type: "string", example: "John Updated" },
            email: { type: "string", format: "email", example: "john.updated@example.com" },
          },
        },
        UpdateRoleInput: {
          type: "object",
          required: ["role"],
          properties: {
            role: { type: "string", enum: ["agent", "manager", "admin"], example: "manager" },
          },
        },
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },
  apis: ["./src/routes/*.js"], 
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };