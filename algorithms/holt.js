export function predictHolt(weeklySales, weeksAhead = 10, alpha = 0.5, beta = 0.3) {
  if (weeklySales.length < 2) {
    throw new Error('Holt forecasting requires sales data for at least two weeks');
  }

  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    throw new RangeError('alpha must be a number between 0 and 1');
  }

  if (!Number.isFinite(beta) || beta < 0 || beta > 1) {
    throw new RangeError('beta must be a number between 0 and 1');
  }

  let level = weeklySales[0];
  let trend = weeklySales[1] - weeklySales[0];

  for (let week = 1; week < weeklySales.length; week += 1) {
    const previousLevel = level; // Smoothed price estimate before the current update.
    const previousTrend = trend; // Estimated price change per week before the current update.

    level =
      alpha * weeklySales[week] +
      (1 - alpha) * (previousLevel + previousTrend);

    trend =
      beta * (level - previousLevel) +
      (1 - beta) * previousTrend;
  }

  const prediction = [];

  for (let week = 1; week <= weeksAhead; week += 1) {
    prediction.push(level + week * trend);
  }

  return prediction;
}
