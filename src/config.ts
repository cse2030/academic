/**
 * Paste the "Publish to web → CSV" link of each Google Sheets tab here.
 * Leave a tab empty to skip it. If ALL are empty, the app shows demo data (clearly labelled).
 * These URLs are public by design: only publish data you are happy to expose.
 */
export const SHEET_URLS = {
  subjects: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTo8ue08zP6F4c2a3S6zH4nMp72MW-EyfuYeMoNPVxhSBEj6Clt0hX97Yphyz_Hx3kbstVXX_GdDFC/pub?gid=0&single=true&output=csv',
  tasks: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTo8ue08zP6F4c2a3S6zH4nMp72MW-EyfuYeMoNPVxhSBEj6Clt0hX97Yphyz_Hx3kbstVXX_GdDFC/pub?gid=1666791711&single=true&output=csv',
  resources: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTo8ue08zP6F4c2a3S6zH4nMp72MW-EyfuYeMoNPVxhSBEj6Clt0hX97Yphyz_Hx3kbstVXX_GdDFC/pub?gid=1195541714&single=true&output=csv',
  schedules: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTo8ue08zP6F4c2a3S6zH4nMp72MW-EyfuYeMoNPVxhSBEj6Clt0hX97Yphyz_Hx3kbstVXX_GdDFC/pub?gid=1820914409&single=true&output=csv',
  exams: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTo8ue08zP6F4c2a3S6zH4nMp72MW-EyfuYeMoNPVxhSBEj6Clt0hX97Yphyz_Hx3kbstVXX_GdDFC/pub?gid=453533424&single=true&output=csv',
}

/**
 * Tasks and study sessions disappear once their date has passed.
 * false = still visible on the due date itself, hidden the next day.
 * true  = hidden as soon as the due date arrives.
 */
export const HIDE_ON_DEADLINE_DAY = true

/** Order of days in the timetable (0=Sunday … 6=Saturday). Default starts on Saturday. */
export const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5]
