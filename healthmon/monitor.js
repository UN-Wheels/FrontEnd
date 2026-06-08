const http = require('http');
const https = require('https');
const { URL } = require('url');

const DEFAULT_INTERVAL_MS = 15000;
const DEFAULT_FAIL_THRESHOLD = 3;
const DEFAULT_PORT = 9090;
const REQUEST_TIMEOUT_MS = 3000;

const rawServices = process.env.SERVICES || '';
const serviceLines = rawServices
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

if (serviceLines.length === 0) {
  console.error(JSON.stringify({ event: 'ERROR', message: 'No SERVICES entries found' }));
}

const services = serviceLines.map((line) => {
  const idx = line.indexOf('=');
  if (idx < 1) {
    throw new Error(`Invalid SERVICES entry: ${line}`);
  }
  const name = line.slice(0, idx).trim();
  const url = line.slice(idx + 1).trim();
  if (!name || !url) {
    throw new Error(`Invalid SERVICES entry: ${line}`);
  }
  return { name, url };
});

const checkIntervalMs = Number(process.env.CHECK_INTERVAL_MS || DEFAULT_INTERVAL_MS);
const failThreshold = Number(process.env.FAIL_THRESHOLD || DEFAULT_FAIL_THRESHOLD);
const port = Number(process.env.PORT || DEFAULT_PORT);

const state = Object.fromEntries(
  services.map((service) => [service.name, {
    service: service.name,
    url: service.url,
    consecutive_failures: 0,
    status: 'healthy',
    last_check: null,
    unhealthy_since: null,
  }])
);

function nowIso() {
  return new Date().toISOString();
}

function logEvent(event) {
  process.stdout.write(`${JSON.stringify(event)}\n`);
}

function fetchUrl(urlString) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(urlString);
    } catch (error) {
      return reject(error);
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const requestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: `${parsed.pathname}${parsed.search}`,
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
    };

    const req = client.request(requestOptions, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error('timeout'));
    });

    req.end();
  });
}

async function checkService(serviceName) {
  const entry = state[serviceName];
  const now = nowIso();
  entry.last_check = now;

  try {
    const statusCode = await fetchUrl(entry.url);
    const healthy = statusCode >= 200 && statusCode < 300;

    if (healthy) {
      if (entry.status === 'unhealthy') {
        logEvent({
          event: 'RECOVERED',
          service: entry.service,
          url: entry.url,
          down_since: entry.unhealthy_since,
          timestamp: now,
        });
        entry.unhealthy_since = null;
      }
      entry.status = 'healthy';
      entry.consecutive_failures = 0;
    } else {
      entry.consecutive_failures += 1;
      if (entry.consecutive_failures >= failThreshold && entry.status !== 'unhealthy') {
        entry.status = 'unhealthy';
        entry.unhealthy_since = entry.unhealthy_since || now;
        logEvent({
          event: 'UNHEALTHY',
          service: entry.service,
          url: entry.url,
          consecutive_failures: entry.consecutive_failures,
          timestamp: now,
        });
      }
    }
  } catch (error) {
    entry.consecutive_failures += 1;
    if (entry.consecutive_failures >= failThreshold && entry.status !== 'unhealthy') {
      entry.status = 'unhealthy';
      entry.unhealthy_since = entry.unhealthy_since || now;
      logEvent({
        event: 'UNHEALTHY',
        service: entry.service,
        url: entry.url,
        consecutive_failures: entry.consecutive_failures,
        timestamp: now,
      });
    }
  }
}

async function checkAllServices() {
  await Promise.all(services.map((s) => checkService(s.name)));
}

function rootStatus() {
  return Object.values(state).some((entry) => entry.status === 'unhealthy') ? 'degraded' : 'healthy';
}

function buildStatusResponse() {
  return {
    status: rootStatus(),
    checked_at: nowIso(),
    services: Object.fromEntries(
      Object.values(state).map((entry) => [entry.service, {
        status: entry.status,
        consecutive_failures: entry.consecutive_failures,
        last_check: entry.last_check,
        url: entry.url,
      }])
    ),
  };
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    const payload = { status: 'ok' };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    const payload = buildStatusResponse();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(port, () => {
  logEvent({ event: 'STARTED', port, timestamp: nowIso() });
});

checkAllServices().catch((error) => {
  logEvent({ event: 'ERROR', message: error.message || 'checkAllServices failed', timestamp: nowIso() });
});
setInterval(() => {
  checkAllServices().catch((error) => {
    logEvent({ event: 'ERROR', message: error.message || 'checkAllServices failed', timestamp: nowIso() });
  });
}, checkIntervalMs);
