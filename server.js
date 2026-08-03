import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method not allowed.");
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const requestedPath =
    requestUrl.pathname === "/"
      ? "./src/scenes/homepage.html"
      : decodeURIComponent(requestUrl.pathname);

  const filePath = path.join(ROOT_DIR, requestedPath.replace(/^\/+/, ""));
  const relativePath = path.relative(ROOT_DIR, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    res.writeHead(403, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>403 Forbidden</h1>");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    const finalPath =
      !statError && stats.isDirectory()
        ? path.join(filePath, "./src/scenes/homepage.html")
        : filePath;

    const extname = path.extname(finalPath).toLowerCase();
    const contentType =
      MIME_TYPES[extname] || "application/octet-stream";

    fs.readFile(finalPath, (readError, content) => {
      if (readError) {
        if (readError.code === "ENOENT") {
          res.writeHead(404, {
            "Content-Type": "text/html; charset=utf-8",
          });
          res.end("<h1>404 Not Found</h1>");
        } else {
          res.writeHead(500, {
            "Content-Type": "text/plain; charset=utf-8",
          });
          res.end(`Server Error: ${readError.code}`);
        }
        return;
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(req.method === "HEAD" ? undefined : content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/`);
});