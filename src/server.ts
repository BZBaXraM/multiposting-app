import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { request as httpsRequest } from 'node:https';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * The deployed MultiPosting API (https://multiposting-fm82.onrender.com) does not send
 * CORS headers, so the browser can't call it cross-origin directly. This reverse-proxies
 * /api/* server-side (not subject to CORS) to the same host/path the Angular client calls
 * in dev via proxy.conf.json, so both `ng serve` and this built SSR server work the same way.
 */
const API_PROXY_HOST = 'multiposting-fm82.onrender.com';

app.use('/api', (req, res) => {
  const proxyReq = httpsRequest(
    {
      host: API_PROXY_HOST,
      port: 443,
      path: `/api${req.url}`,
      method: req.method,
      headers: { ...req.headers, host: API_PROXY_HOST },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'Upstream API request failed', error: (err as Error).message }));
  });
  req.pipe(proxyReq);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
