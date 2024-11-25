// Analysis is based on one-tailed, Pearson's correlation coefficient.

const { sampleCorrelation } = require('simple-statistics')
const { MINIMUM_VALID_SAMPLE_SIZE } = require('./constants')

/**
 *
 * @param x An array of a numbers.
 * @param y An array of numbers.
 * @return {number} The Pearson Correlation.
 */
function calculatePearsonCorrelation(x, y) {
  return sampleCorrelation(x, y)
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
