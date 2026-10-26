import { SHEET_URLS } from './config'
import type { Data, Priority, Status } from './types'
import { SAMPLE } from './sample'

/** Minimal RFC-4180 CSV parser (quotes, escaped quotes, newlines in cells). */
export function parseCSV(text: string): string[][] {
  const out: string[][] = []; let row: string[] = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); out.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); out.push(row) }
  return out
}
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
type Rec = Record<string, string>
function records(csv: string): Rec[] {
  const [h = [], ...r] = parseCSV(csv); const keys = h.map(norm)
  return r.filter(x => x.some(c => c.trim())).map(x => Object.fromEntries(keys.map((k, i) => [k, (x[i] ?? '').trim()])))
}
const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => iso(new Date())
/** Accepts YYYY-MM-DD or anything Date can parse; returns '' when invalid. */
export function normDate(s: string): string {
  if (!s) return ''
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`
  const t = new Date(s); return isNaN(+t) ? '' : iso(t)
}
export function daysUntil(d: string): number { return Math.round((+new Date(d + 'T00:00') - +new Date(today() + 'T00:00')) / 864e5) }
/** Only http(s) links are kept; bare domains get https://. */
export function normUrl(s: string): string {
  if (!s) return ''
  try { const u = new URL(/^[a-z]+:/i.test(s) ? s : 'https://' + s); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.href : '' } catch { return '' }
}
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
/** Day name (Sat, Saturday…) → 0-6; falls back to the weekday of an optional Date column. */
function dayIdx(day: string, date: string): number {
  const k = day.toLowerCase().trim().slice(0, 3)
  const i = k ? DAYS.findIndex(d => d.startsWith(k)) : -1
  if (i >= 0) return i
  const nd = normDate(date); return nd ? new Date(nd + 'T00:00').getDay() : -1
}
export const mins = (t: string) => { const m = t.match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : 9999 }
const hhmm = (n: number) => `${pad(Math.floor(n / 60) % 24)}:${pad(n % 60)}`
const status = (s: string): Status => { const k = norm(s); return k === 'done' || k === 'complete' || k === 'completed' ? 'done' : k.startsWith('inprog') || k === 'doing' ? 'in-progress' : 'todo' }
const priority = (s: string): Priority => { const k = norm(s); return k === 'high' || k === 'medium' || k === 'low' ? k : 'medium' }
const color = (s: string) => /^#[0-9a-f]{3,8}$/i.test(s) ? s : '#0f766e'

async function get(url: string) {
  const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const t = await r.text(); if (/^\s*<!doctype html|^\s*<html/i.test(t)) throw new Error('got a web page, not CSV – check the publish link')
  return records(t)
}

export async function loadData(): Promise<Data> {
  const urls = SHEET_URLS
  if (!Object.values(urls).some(Boolean)) return { ...SAMPLE, demo: true }
  const warnings: string[] = []
  const safe = async (name: keyof typeof urls) => {
    if (!urls[name]) return [] as Rec[]
    try { return await get(urls[name]) } catch (e) { warnings.push(`Could not load "${name}": ${(e as Error).message}`); return [] }
  }
  const [s, t, r, c, e] = await Promise.all((['subjects', 'tasks', 'resources', 'schedules', 'exams'] as const).map(safe))
  if (urls.subjects && !s.length && warnings.length) throw new Error(warnings.join(' '))
  const need = (rec: Rec, keys: string[], label: string) => keys.every(k => rec[k]) || (warnings.push(`Skipped a ${label} row missing ${keys.join(' / ')}`), false)
  const subjects = s.filter(x => need(x, ['subjectid', 'subjectname'], 'subject')).map(x => ({
    id: x.subjectid, name: x.subjectname, category: x.category, color: color(x.color), instructor: x.instructor, description: x.description, semester: x.semester }))
  const tasks = t.filter(x => need(x, ['taskid', 'title'], 'task')).map(x => ({
    id: x.taskid, subjectId: x.subjectid, title: x.title, description: x.description, priority: priority(x.priority),
    status: status(x.status), due: normDate(x.duedate), completed: normDate(x.completiondate) }))
  const resources = r.filter(x => need(x, ['resourceid', 'title'], 'resource')).map(x => {
    const url = normUrl(x.url); if (x.url && !url) warnings.push(`Invalid URL ignored for resource "${x.title}"`)
    return { id: x.resourceid, subjectId: x.subjectid, type: x.resourcetype || 'Other', title: x.title, url, description: x.description, notes: x.notes }
  })
  const sessions = c.filter(x => need(x, ['sessionid'], 'timetable')).flatMap(x => {
    const day = dayIdx(x.day, x.date)
    if (day < 0) { warnings.push(`Timetable row "${x.sessionid}" has no valid Day (use e.g. Saturday)`); return [] }
    const start = x.starttime, dur = parseInt(x.duration) || (start && x.endtime ? mins(x.endtime) - mins(start) : 0)
    const end = x.endtime || (start && dur > 0 && mins(start) < 9999 ? hhmm(mins(start) + dur) : '')
    return [{ id: x.sessionid, subjectId: x.subjectid, day, start, end, duration: dur > 0 ? dur : 0, location: x.location, type: x.type }]
  })
  const exams = e.filter(x => need(x, ['examid', 'date'], 'exam') && normDate(x.date)).map(x => ({
    id: x.examid, subjectId: x.subjectid, title: x.title || 'Exam', date: normDate(x.date), notes: x.notes }))
  return { subjects, tasks, resources, sessions, exams, warnings, demo: false }
}
