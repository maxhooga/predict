# predict

A basic Node.js HTTP server with no external dependencies.

## Run

```sh
npm start
```

The server listens on port 3000 by default. Set `PORT` to use a different port.

## Endpoint

`GET /` returns HTTP 200 with a placeholder JSON response:

```json
{"message":"Placeholder response"}
```

All other requests return HTTP 404.
