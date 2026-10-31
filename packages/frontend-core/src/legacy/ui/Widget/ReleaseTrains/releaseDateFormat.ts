import type { ReleaseDate } from '@env-hopper/backend-core'

/** A day-only date names a calendar day, not an instant: read it at UTC noon so no zone moves it. */
const instant = (d: ReleaseDate) =>
  new Date(knowsTime(d) ? d.date : `${d.date.slice(0, 10)}T12:00:00Z`)

export const knowsTime = (d: ReleaseDate) => d.date.length > 10

/** The zone a date is read in: the display zone when it has a time, else none (UTC noon). */
const zoneOf = (d: ReleaseDate, displayTimeZone: string | undefined) =>
  knowsTime(d) ? displayTimeZone : 'UTC'

const yearIn = (date: Date, timeZone: string | undefined) =>
  new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric' }).format(date)

/** The year too, when it is not this one: a tracker's typo must not read as this year. */
function dayOptions(
  d: ReleaseDate,
  displayTimeZone: string | undefined,
  now: Date,
  withWeekday: boolean,
): Intl.DateTimeFormatOptions {
  const zone = zoneOf(d, displayTimeZone)
  const otherYear = yearIn(instant(d), zone) !== yearIn(now, displayTimeZone)
  return {
    ...(withWeekday && { weekday: 'short' }),
    month: 'short',
    day: 'numeric',
    ...(otherYear && { year: 'numeric' }),
  }
}

function format(
  d: ReleaseDate,
  options: Intl.DateTimeFormatOptions,
  timeZone: string | undefined,
): string {
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: zoneOf(d, timeZone),
  }).format(instant(d))
}

function zoneName(d: ReleaseDate, timeZone: string | undefined): string {
  return (
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(instant(d))
      .find((p) => p.type === 'timeZoneName')?.value ?? ''
  )
}

const TIME: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }

const time = (d: ReleaseDate, timeZone: string | undefined) =>
  `${format(d, TIME, timeZone)} ${zoneName(d, timeZone)}`

/** "Oct 27 · 6:00 PM PDT", "Nov 10", or "Nov 15, 2027" outside this year. */
export function formatRowDate(
  d: ReleaseDate,
  displayTimeZone: string,
  now: Date = new Date(),
): string {
  const day = format(
    d,
    dayOptions(d, displayTimeZone, now, false),
    displayTimeZone,
  )
  return knowsTime(d) ? `${day} · ${time(d, displayTimeZone)}` : day
}

/** "Tue, Oct 27 · 6:00 PM PDT", or "Tue, Nov 10". */
export function formatCardDate(
  d: ReleaseDate,
  displayTimeZone: string,
  now: Date = new Date(),
): string {
  const day = format(
    d,
    dayOptions(d, displayTimeZone, now, true),
    displayTimeZone,
  )
  return knowsTime(d) ? `${day} · ${time(d, displayTimeZone)}` : day
}

/** "8:00 PM CDT your time"; null when the time is not known. */
export function formatOtherZones(d: ReleaseDate): string | null {
  return knowsTime(d) ? `${time(d, undefined)} your time` : null
}

/** "Wed, Oct 28": the day a Source names, as that Source states it. */
export function formatDay(d: ReleaseDate, now: Date = new Date()): string {
  const day = { ...d, date: d.date.slice(0, 10) }
  return format(day, dayOptions(day, 'UTC', now, true), 'UTC')
}
