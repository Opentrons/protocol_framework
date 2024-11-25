// Analysis is based on one-tailed, Pearson's correlation coefficient.

const { MINIMUM_VALID_SAMPLE_SIZE } = require('./constants')

/**
 *
 * @param x An array of a numbers.
 * @param y An array of numbers.
 * @return {number} The Pearson Correlation.
 */
function calculatePearsonCorrelation(x, y) {
  const n = x.length
  let sum_x = 0
  let sum_y = 0
  let sum_xy = 0
  let sum_x2 = 0
  let sum_y2 = 0

  for (let i = 0; i < n; i++) {
    sum_x += x[i]
    sum_y += y[i]
    sum_xy += x[i] * y[i]
    sum_x2 += x[i] * x[i]
    sum_y2 += y[i] * y[i]
  }

  const numerator = n * sum_xy - sum_x * sum_y
  const denominator = Math.sqrt(
    (n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)
  )

  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * @description Calculate p-value using t-distribution approximation for a one-tailed test.
 * If there are too few samples, assume no correlation.
 * For positive correlations only.
 * @param correlation The Pearson Correlation
 * @param sampleSize The total number of samples.
 * @return {number} The p-value.
 */
function calculatePValueOneTailed(correlation, sampleSize) {
  if (sampleSize < MINIMUM_VALID_SAMPLE_SIZE) {
    return 1
  }

  // The t-statistic
  const t =
    correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation))

  // Approximate p-value using t-distribution (one-tailed test)
  const degreesOfFreedom = sampleSize - 2
  return 1 - tDistributionCDF(t, degreesOfFreedom)
}

// t-distribution CDF approximation
function tDistributionCDF(t, df) {
  const x = df / (df + t * t)
  return 1 - 0.5 * Math.pow(x, df / 2)
}

function interpretResults(result) {
  if (!result.isSignificant) {
    return 'No significant correlation found'
  }

  const strength = Math.abs(result.correlation)
  const direction = result.correlation > 0 ? 'positive' : 'negative'

  if (strength > 0.7) {
    return `Strong ${direction} correlation (>0.7)`
  } else if (strength > 0.3) {
    return `Moderate ${direction} correlation (>0.3 and <0.7)`
  } else {
    return `Weak ${direction} correlation (<=0.3)`
  }
}

module.exports = {
  calculatePearsonCorrelation,
  calculatePValueOneTailed,
  interpretResults,
}
