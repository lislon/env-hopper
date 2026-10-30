import type { ReleaseDate } from '@env-hopper/backend-core'

/** A day-only date names a calendar day, not an instant: read it at UTC noon so no zone moves it. */
const instant = (d: ReleaseDate) =>
  new Date(knowsTime(d) ? d.date : `${d.date.slice(0, 10)}T12:00:00Z`)

export const knowsTime = (d: ReleaseDate) => d.date.length > 10

function format(
  d: ReleaseDate,
  options: Intl.DateTimeFormatOptions,
  timeZone: string | undefined,
): string {
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: knowsTime(d) ? timeZone : 'UTC',
  }).format(instant(d))
}

function zoneName(d: ReleaseDate, timeZone: string | undefined): string {
  return (
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(instant(d))
      .find((p) => p.type === 'timeZoneName')?.value ?? ''
  )
}

const DAY: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
const WEEKDAY_DAY: Intl.DateTimeFormatOptions = { weekday: 'short', ...DAY }
const TIME: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }

const time = (d: ReleaseDate, timeZone: string | undefined) =>
  `${format(d, TIME, timeZone)} ${zoneName(d, timeZone)}`

/** "Oct 27 · 6:00 PM PDT", or "Nov 10" when the time is not known. */
export function formatRowDate(d: ReleaseDate, displayTimeZone: string): string {
  return knowsTime(d)
    ? `${format(d, DAY, displayTimeZone)} · ${time(d, displayTimeZone)}`
    : format(d, DAY, displayTimeZone)
}

/** "Tue, Oct 27 · 6:00 PM PDT", or "Tue, Nov 10". */
export function formatCardDate(
  d: ReleaseDate,
  displayTimeZone: string,
): string {
  return knowsTime(d)
    ? `${format(d, WEEKDAY_DAY, displayTimeZone)} · ${time(d, displayTimeZone)}`
    : format(d, WEEKDAY_DAY, displayTimeZone)
}

/** "8:00 PM CDT your time · 1:00 AM UTC"; null when the time is not known. */
export function formatOtherZones(d: ReleaseDate): string | null {
  return knowsTime(d)
    ? `${time(d, undefined)} your time · ${format(d, TIME, 'UTC')} UTC`
    : null
}

/** "Wed, Oct 28": the day a Source names, as that Source states it. */
export function formatDay(d: ReleaseDate): string {
  return format({ ...d, date: d.date.slice(0, 10) }, WEEKDAY_DAY, 'UTC')
}
