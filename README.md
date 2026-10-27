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

## Forecasting algorithms

Each algorithm is available as a standalone function:

```js
import { predictNaive } from './algorithms/naive.js';
import { predictSES } from './algorithms/ses.js';
import { predictHolt } from './algorithms/holt.js';

const weeklySales = [100, 120, 90];

predictNaive(weeklySales, 3); // [90, 90, 90]
predictSES(weeklySales, 3, 0.5); // [100, 100, 100]
predictHolt(weeklySales, 3, 0.5, 0.3); // [127.5, 140, 152.5]
```

All functions accept an array of weekly sales numbers and return an array of
forecast values. `weeksAhead` defaults to 10. SES and Holt use `alpha = 0.5` by
default; Holt also uses `beta = 0.3` and requires at least two sales values.
