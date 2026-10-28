export interface Label {
  key: string;
  amount: number;
}
export function score(expected: Label[], actual: Label[], tolerance = 0.01) {
  const matched = new Set<number>();
  let truePositive = 0;
  for (const item of actual) {
    const index = expected.findIndex(
      (x, i) =>
        !matched.has(i) &&
        x.key === item.key &&
        Math.abs(x.amount - item.amount) <= tolerance,
    );
    if (index >= 0) {
      truePositive++;
      matched.add(index);
    }
  }
  const precision = actual.length ? truePositive / actual.length : null;
  const recall = expected.length ? truePositive / expected.length : null;
  return {
    truePositive,
    falsePositive: actual.length - truePositive,
    falseNegative: expected.length - truePositive,
    precision,
    recall,
    f1:
      precision === null || recall === null
        ? null
        : precision + recall === 0
          ? 0
          : (2 * precision * recall) / (precision + recall),
  };
}
