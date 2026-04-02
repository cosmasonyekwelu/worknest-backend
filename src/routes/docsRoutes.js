import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import swaggerUiDist from "swagger-ui-dist";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const openApiPath = path.join(projectRoot, "openapi.json");
const swaggerUiAssetPath = swaggerUiDist.getAbsoluteFSPath();

const openApiDocument = JSON.parse(fs.readFileSync(openApiPath, "utf8"));

const renderSwaggerHtml = () => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WorkNest API Docs</title>
    <link rel="stylesheet" href="/docs/assets/swagger-ui.css" />
    <link rel="icon" type="image/png" href="/docs/assets/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="/docs/assets/favicon-16x16.png" sizes="16x16" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/docs/assets/swagger-ui-bundle.js" crossorigin="anonymous"></script>
    <script src="/docs/assets/swagger-ui-standalone-preset.js" crossorigin="anonymous"></script>
    <script src="/docs/swagger-init.js"></script>
  </body>
</html>`;

const swaggerInitScript = `window.addEventListener("load", () => {
  window.ui = SwaggerUIBundle({
    url: "/openapi.json",
    dom_id: "#swagger-ui",
    deepLinking: true,
    displayRequestDuration: true,
    persistAuthorization: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: "StandaloneLayout",
    docExpansion: "list"
  });
});`;

router.get("/openapi.json", (_req, res) => {
  res.status(200).json(openApiDocument);
});

router.use(
  "/docs/assets",
  express.static(swaggerUiAssetPath, {
    index: false,
    maxAge: "1d",
  }),
);

router.get("/docs/swagger-init.js", (_req, res) => {
  res.type("application/javascript").status(200).send(swaggerInitScript);
});

router.get(/^\/docs\/?$/, (_req, res) => {
  res.type("html").status(200).send(renderSwaggerHtml());
});

export default router;
