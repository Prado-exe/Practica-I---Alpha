const http = require("http");
const { PORT } = require("./config/env");
const { sendJson } = require("./utils/json");
const { handleAuthRoutes } = require("./routes/auth.routes");

const server = http.createServer(async (req, res) => {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const handled = await handleAuthRoutes(req, res);
  if (handled !== false) return;

  return sendJson(res, 404, {
    ok: false,
    message: "Ruta no encontrada",
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});