export function predictNaive(weeklySales, weeksAhead = 10) {
  const lastWeekSales = weeklySales[weeklySales.length - 1];
  const prediction = [];

  for (let week = 0; week < weeksAhead; week += 1) {
    prediction.push(lastWeekSales);
  }

  return prediction;
}
