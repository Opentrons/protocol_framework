export const linearInterpolate = (
  target: number,
  interpolationPoints: Array<[number, number]>
): number | null => {
  console.assert(
    interpolationPoints.length > 0,
    'At least one bucket required for interpolation'
  )
  if (interpolationPoints.length === 0) {
    return interpolationPoints[0][1]
  }
  if (target < interpolationPoints[0][0]) {
    return interpolationPoints[0][1]
  }
  if (target > interpolationPoints[interpolationPoints.length - 1][0]) {
    return interpolationPoints[interpolationPoints.length - 1][1]
  }
  for (let i = 0; i <= interpolationPoints.length - 1; i++) {
    const bucket = interpolationPoints.slice(i, i + 2)
    if (target >= bucket[0][0] && target <= bucket[1][0]) {
      const slope =
        (bucket[1][1] - bucket[0][1]) / (bucket[1][0] - bucket[0][0])
      const yIntercept = bucket[0][1] - slope * bucket[0][0]
      return slope * target + yIntercept
    }
  }
  console.warn(
    'No interpolation point found. Make sure interpolation buckets are ordered correctly.'
  )
  return null
}
