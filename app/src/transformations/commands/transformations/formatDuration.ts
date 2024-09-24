import padStart from 'lodash/padStart'
import type { Duration } from 'date-fns'
/**
 * utility to format a date-fns duration object to hh:mm:ss
 * @param duration date-fns duration object
 * @returns string in format hh:mm:ss, e.g. 03:15:45
 */
export function formatDuration(duration: Duration): string {
  const { days, hours, minutes, seconds } = duration

  // edge case: protocol runs (or is paused) for over 24 hours
  const hoursWithDays = days != null ? days * 24 + (hours ?? 0) : hours

  const paddedHours = padStart(hoursWithDays?.toString(), 2, '0')
  const paddedMinutes = padStart(minutes?.toString(), 2, '0')
  const paddedSeconds = padStart(seconds?.toString(), 2, '0')

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`
}