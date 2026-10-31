import { describe, expect, it } from 'vitest'
import {
  formatCardDate,
  formatDay,
  formatRowDate,
} from '~/legacy/ui/Widget/ReleaseTrains/releaseDateFormat'

const PT = 'America/Los_Angeles'
const NOW = new Date('2026-10-30T12:00:00Z')
const at = (date: string) => ({ sourceName: 'Jira', date })

describe('release dates', () => {
  it('this year reads without the year', () => {
    expect({
      row: formatRowDate(at('2026-11-10T02:00:00-08:00'), PT, NOW),
      rowDay: formatRowDate(at('2026-11-30'), PT, NOW),
      card: formatCardDate(at('2026-11-10T02:00:00-08:00'), PT, NOW),
      conflict: formatDay(at('2026-10-28'), NOW),
    }).toEqual({
      row: 'Nov 10 · 2:00 AM PST',
      rowDay: 'Nov 30',
      card: 'Tue, Nov 10 · 2:00 AM PST',
      conflict: 'Wed, Oct 28',
    })
  })

  it('another year says which, so a typo in a tracker is not read as this year', () => {
    expect({
      row: formatRowDate(at('2027-11-15'), PT, NOW),
      card: formatCardDate(at('2027-11-15'), PT, NOW),
      conflict: formatDay(at('2030-10-13'), NOW),
    }).toEqual({
      row: 'Nov 15, 2027',
      card: 'Mon, Nov 15, 2027',
      conflict: 'Sun, Oct 13, 2030',
    })
  })
})
