import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { predictNaive } from './algorithms/naive.js';
import { predictSES } from './algorithms/ses.js';
import { predictHolt } from './algorithms/holt.js';

const port = process.env.PORT || 3000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const clientDirectory = fileURLToPath(new URL('./client/dist/', import.meta.url));
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

function readNaiveData(body) {
  return body.data.map((point) => point.value);
}

const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json');

  //NAIVE METHOD
  if (request.method === 'POST' && request.url === '/naive') {
    try {
      request.setEncoding('utf8');
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }

      const input = JSON.parse(body);
      if (!Array.isArray(input?.data) || input.data.length === 0) {
        throw new Error('data must be a non-empty array');
      }

      const prediction = predictNaive(readNaiveData(input));
      const lastTimestamp = Date.parse(input.data.at(-1).timestamp);

      // Assign each predicted value to the next weekly timestamp.
      const data = prediction.map((value, index) => ({
        timestamp: new Date(lastTimestamp + (index + 1) * WEEK_MS).toISOString(),
        value,
      }));

      response.writeHead(200);
      response.end(JSON.stringify({ data }));
    } catch (error) {
      response.writeHead(400);
      response.end(JSON.stringify({ message: error.message }));
    }
    return;
  }

  //SES METHOD
  if (request.method === 'POST' && request.url === '/ses') {
    try {
      request.setEncoding('utf8');
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }

      const input = JSON.parse(body);
      if (!Array.isArray(input?.data) || input.data.length === 0) {
        throw new Error('data must be a non-empty array');
      }

      const alpha = input.params?.find((param) => param.name === 'alpha')?.value ?? 0.5;
      const weeklySales = input.data.map((point) => point.value);
      const prediction = predictSES(weeklySales, 10, alpha);
      const lastTimestamp = Date.parse(input.data.at(-1).timestamp);

      // Assign each predicted value to the next weekly timestamp.
      const data = prediction.map((value, index) => ({
        timestamp: new Date(lastTimestamp + (index + 1) * WEEK_MS).toISOString(),
        value,
      }));

      response.writeHead(200);
      response.end(JSON.stringify({ data }));
    } catch (error) {
      response.writeHead(400);
      response.end(JSON.stringify({ message: error.message }));
    }
    return;
  }

  //HOLT METHOD
  if (request.method === 'POST' && request.url === '/holt') {
    try {
      request.setEncoding('utf8');
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }

      const input = JSON.parse(body);
      if (!Array.isArray(input?.data) || input.data.length < 2) {
        throw new Error('data must contain at least two weekly observations');
      }

      const alpha = input.params?.find((param) => param.name === 'alpha')?.value ?? 0.5;
      const beta = input.params?.find((param) => param.name === 'beta')?.value ?? 0.3;
      const weeklySales = input.data.map((point) => point.value);
      const prediction = predictHolt(weeklySales, 10, alpha, beta);
      const lastTimestamp = Date.parse(input.data.at(-1).timestamp);

      // Assign each predicted value to the next weekly timestamp.
      const data = prediction.map((value, index) => ({
        timestamp: new Date(lastTimestamp + (index + 1) * WEEK_MS).toISOString(),
        value,
      }));

      response.writeHead(200);
      response.end(JSON.stringify({ data }));
    } catch (error) {
      response.writeHead(400);
      response.end(JSON.stringify({ message: error.message }));
    }
    return;
  }

  if (request.method === 'GET' && (request.url === '/' || request.url.startsWith('/assets/'))) {
    try {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      const filePath = resolve(clientDirectory, pathname === '/' ? 'index.html' : pathname.slice(1));
      if (!filePath.startsWith(clientDirectory)) throw new Error('File not found');

      const file = await readFile(filePath);
      response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
      response.end(file);
    } catch {
      response.writeHead(404);
      response.end(JSON.stringify({ message: 'Frontend file not found. Run npm run build first.' }));
    }
    return;
  }

  response.writeHead(404);
  response.end(JSON.stringify({ message: 'Not found' }));
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${server.address().port}`);
});
