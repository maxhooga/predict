export function predictSES(weeklySales, weeksAhead = 10, alpha = 0.5) {
  let level = weeklySales[0];

  for (let week = 1; week < weeklySales.length; week += 1) {
    level = level + alpha * (weeklySales[week] - level);
  }

  const prediction = [];

  for (let week = 0; week < weeksAhead; week += 1) {
    prediction.push(level);
  }

  return prediction;
}
