import { createServer } from 'node:http';

const port = process.env.PORT || 3000;

const server = createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');

  if (request.method === 'GET' && request.url === '/') {
    response.writeHead(200);
    response.end(JSON.stringify({ message: 'Placeholder response' }));
    return;
  }

  response.writeHead(404);
  response.end(JSON.stringify({ message: 'Not found' }));
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
