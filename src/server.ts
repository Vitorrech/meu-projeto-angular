import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const defaultGeminiModel = 'gemini-2.5-flash-lite';

loadLocalEnv();

app.use(express.json({ limit: '64kb' }));

app.post('/api/gemini-triage', async (req, res) => {
  const apiKey = process.env['GEMINI_API_KEY'];
  const model = process.env['GEMINI_MODEL'] || defaultGeminiModel;

  if (!apiKey) {
    res.status(500).json({
      error: {
        status: 'FAILED_PRECONDITION',
        message: 'gemini_api_key_missing',
      },
    });
    return;
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      },
    );

    const responseText = await geminiResponse.text();
    const contentType = geminiResponse.headers.get('content-type') || 'application/json';

    res.status(geminiResponse.status).type(contentType).send(responseText);
  } catch {
    res.status(502).json({
      error: {
        status: 'BAD_GATEWAY',
        message: 'gemini_request_failed',
      },
    });
  }
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

function loadLocalEnv(): void {
  const localEnvPath = join(process.cwd(), '.env.local');

  if (!existsSync(localEnvPath)) {
    return;
  }

  const lines = readFileSync(localEnvPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
