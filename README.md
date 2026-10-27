# predict

A Node.js HTTP API for predicting weekly sales, with no external dependencies.
Requires Node.js 18 or newer.

## Run

```sh
npm start
```

The server listens on port 3000 by default. Set `PORT` to use a different port.

## API

`GET /` returns HTTP 200 with a placeholder JSON response:

```json
{"message":"Placeholder response"}
```

### POST /naive

Accepts weekly sales in the request body. Returns predictions for the next 10
weeks, repeating the last observed sales value. Each timestamp is seven days
after the previous one.

```sh
curl http://localhost:3000/naive \
  -H 'Content-Type: application/json' \
  -d '{
    "data": [
      { "timestamp": "2019-03-18T00:00:00.000Z", "value": 2067 },
      { "timestamp": "2019-03-25T00:00:00.000Z", "value": 2283 },
      { "timestamp": "2019-04-01T00:00:00.000Z", "value": 1929 }
    ]
  }'
```

Response:

```json
{
  "data": [
    { "timestamp": "2019-04-08T00:00:00.000Z", "value": 1929 },
    { "timestamp": "2019-04-15T00:00:00.000Z", "value": 1929 },
    { "timestamp": "2019-04-22T00:00:00.000Z", "value": 1929 },
    { "timestamp": "2019-04-29T00:00:00.000Z", "value": 1929 },
    { "timestamp": "2019-05-06T00:00:00.000Z", "value": 1929 },
    { "timestamp": "2019-05-13T00:00:00.000Z", "value": 1929 },
    { "timestamp": "2019-05-20T00:00:00.000Z", "value": 1929 },
    { "timestamp": "2019-05-27T00:00:00.000Z", "value": 1929 },
    { "timestamp": "2019-06-03T00:00:00.000Z", "value": 1929 },
    { "timestamp": "2019-06-10T00:00:00.000Z", "value": 1929 }
  ]
}
```

No algorithm parameters are needed. Input data should contain weekly observations
in chronological order, with ISO timestamps and numeric sales values. The server
checks that `data` is a non-empty array. Invalid JSON or request processing errors
return HTTP 400 with `{ "message": "..." }`. Unsupported routes return HTTP 404.

### POST /ses

Predicts weekly sales using simple exponential smoothing. Returns the same
`{ "data": [...] }` format with 10 future weekly predictions.

`alpha` is optional and defaults to `0.5`. Pass it through the `params` array:

```sh
curl http://localhost:3000/ses \
  -H 'Content-Type: application/json' \
  -d '{
    "params": [{ "name": "alpha", "value": 0.25 }],
    "data": [
      { "timestamp": "2019-03-18T00:00:00.000Z", "value": 100 },
      { "timestamp": "2019-03-25T00:00:00.000Z", "value": 140 },
      { "timestamp": "2019-04-01T00:00:00.000Z", "value": 120 }
    ]
  }'
```

For this example, every predicted value is `112.5`, starting at
`2019-04-08T00:00:00.000Z`. Use an `alpha` between 0 and 1: larger values make the
estimate react more strongly to recent sales. Omitting `params` uses the default.

### POST /holt

Predicts weekly sales using Holt's linear trend method. Requires at least two
observations and returns `{ "data": [...] }` with 10 future weekly predictions.

`alpha` and `beta` are optional and default to `0.5` and `0.3`. Both must be
numbers between 0 and 1. `alpha` controls the level update; `beta` controls the
trend update.

```sh
curl http://localhost:3000/holt \
  -H 'Content-Type: application/json' \
  -d '{
    "params": [
      { "name": "alpha", "value": 0.5 },
      { "name": "beta", "value": 0.3 }
    ],
    "data": [
      { "timestamp": "2019-03-18T00:00:00.000Z", "value": 100 },
      { "timestamp": "2019-03-25T00:00:00.000Z", "value": 120 },
      { "timestamp": "2019-04-01T00:00:00.000Z", "value": 90 }
    ]
  }'
```

The first predicted point is
`{ "timestamp": "2019-04-08T00:00:00.000Z", "value": 127.5 }`.

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
