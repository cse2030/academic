import { useEffect, useMemo, useState } from 'react'
import { loadData, today, daysUntil, mins } from './data'
import { HIDE_ON_DEADLINE_DAY, WEEK_ORDER } from './config'
import type { Data, Status, Task, Subject, Session } from './types'

const TABS = [['', 'Overview'], ['timetable', 'Timetable'], ['tasks', 'Tasks'], ['calendar', 'Calendar'], ['subjects', 'Subjects'], ['resources', 'Resources']] as const
const gone = (d: string) => !!d && (HIDE_ON_DEADLINE_DAY ? d <= today() : d < today())
const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const useHash = () => {
  const [h, setH] = useState(location.hash.slice(2))
  useEffect(() => { const f = () => setH(location.hash.slice(2)); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h.split('/')
}
const fmt = (d: string) => d ? new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'No date'
const rel = (d: string) => { const n = daysUntil(d); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n === -1 ? 'yesterday' : n > 0 ? `in ${n} days` : `${-n} days ago` }

export default function App() {
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState('')
  const [planned, setPlanned] = useState(false)
  const [q, setQ] = useState('')
  // Status changes are stored in this browser only; the spreadsheet is never written to.
  const [over, setOver] = useState<Record<string, Status>>(() => { try { return JSON.parse(localStorage.getItem('status-overrides') || '{}') } catch { return {} } })
  const [route, id] = useHash()
  const load = () => { setData(null); setErr(''); loadData().then(d => { setPlanned(d.tasks.length + d.exams.length > 0); setData({ ...d, tasks: d.tasks.filter(t => !gone(t.due)), sessions: d.sessions, exams: d.exams.filter(x => !gone(x.date)) }) }).catch(e => setErr(e.message)) }
  useEffect(load, [])
  const setStatus = (t: Task, s: Status) => { const n = { ...over, [t.id]: s }; setOver(n); try { localStorage.setItem('status-overrides', JSON.stringify(n)) } catch { /* storage unavailable */ } }
  const tasks = useMemo(() => (data?.tasks ?? []).map(t => ({ ...t, status: over[t.id] ?? t.status })), [data, over])
  const subj = useMemo(() => new Map((data?.subjects ?? []).map(s => [s.id, s])), [data])
  const match = (...f: string[]) => !q || f.join(' ').toLowerCase().includes(q.toLowerCase())

  const hasPlan = !data || planned
  return <div className="app">
    <header>
      <a className="brand" href="#/">Study Desk</a>
      <nav aria-label="Main">{TABS.filter(([k]) => k === 'timetable' ? !data || data.sessions.length > 0 : k === 'tasks' || k === 'calendar' ? hasPlan : true).map(([k, l]) => <a key={k} href={`#/${k}`} aria-current={route === k || (k === 'subjects' && route === 'subject') ? 'page' : undefined}>{l}</a>)}</nav>
      <input type="search" placeholder="Search…" aria-label="Search" value={q} onChange={e => setQ(e.target.value)} />
    </header>
    <main>
      {err && <div className="msg error" role="alert"><b>Couldn’t load your spreadsheet.</b> {err}<br />Check that each tab is published to the web as CSV and the links in <code>src/config.ts</code> are correct. <button onClick={load}>Try again</button></div>}
      {!data && !err && <p className="msg" role="status">Loading your academic data…</p>}
      {data && <>
        {data.demo && <div className="msg demo">Showing demo data. Add your Google Sheets links in <code>src/config.ts</code> to see your own.</div>}
        {data.warnings.length > 0 && <details className="msg warn"><summary>{data.warnings.length} data warning(s)</summary><ul>{data.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}
        {route === '' && <Overview data={data} tasks={tasks} subj={subj} planned={planned} />}
        {route === 'timetable' && <Timetable sessions={data.sessions.filter(x => match(subj.get(x.subjectId)?.name ?? '', x.location, x.type))} subj={subj} />}
        {route === 'tasks' && <Tasks tasks={tasks.filter(t => match(t.title, t.description, subj.get(t.subjectId)?.name ?? ''))} subj={subj} setStatus={setStatus} />}
        {route === 'calendar' && <Calendar data={data} tasks={tasks} subj={subj} match={match} />}
        {route === 'subjects' && <Subjects list={data.subjects.filter(s => match(s.name, s.category, s.instructor))} tasks={tasks} />}
        {route === 'subject' && <SubjectPage s={subj.get(id)} data={data} tasks={tasks} setStatus={setStatus} />}
        {route === 'resources' && <Resources data={data} subj={subj} match={match} />}
      </>}
    </main>
  </div>
}

const Dot = ({ s }: { s?: Subject }) => <span className="dot" style={{ background: s?.color ?? '#888' }} aria-hidden />
const Empty = ({ children }: { children: string }) => <p className="empty">{children}</p>

function Overview({ data, tasks, subj, planned }: { data: Data; tasks: (Task)[]; subj: Map<string, Subject>; planned: boolean }) {
  if (!planned) return <><section className="hero"><h1>Your subjects</h1><p>{data.subjects.length} subjects · {data.resources.length} resources</p></section>{data.sessions.length > 0 && <Today sessions={data.sessions} subj={subj} />}{data.subjects.length ? <Subjects list={data.subjects} tasks={tasks} /> : <Empty>No subjects yet. Add rows to the Subjects tab.</Empty>}</>
  const t0 = today()
  const open = tasks.filter(t => t.status !== 'done')
  const overdue = open.filter(t => t.due && t.due < t0)
  const upcoming = open.filter(t => t.due && t.due >= t0).sort((a, b) => a.due.localeCompare(b.due))
  const done = tasks.length - open.length, pct = tasks.length ? Math.round(done / tasks.length * 100) : 0
  const next = [...data.exams.filter(e => e.date >= t0)].sort((a, b) => a.date.localeCompare(b.date))[0]
  return <>
    <section className="hero">
      <div><h1>{overdue.length ? `${overdue.length} overdue, ${upcoming.length} coming up` : upcoming.length ? `${upcoming.length} tasks coming up` : 'You’re all caught up'}</h1>
        {next && <p>Next exam: <b>{next.title}</b> · {subj.get(next.subjectId)?.name} · {fmt(next.date)} ({rel(next.date)})</p>}</div>
      <div className="progress" role="img" aria-label={`${pct}% complete`}><div style={{ width: pct + '%' }} /><span>{done} of {tasks.length} done · {pct}%</span></div>
    </section>
    <div className="cols">
      <Today sessions={data.sessions} subj={subj} />
      <section><h2>Upcoming deadlines</h2>{upcoming.length ? <List tasks={upcoming.slice(0, 6)} subj={subj} /> : <Empty>No upcoming deadlines. Add tasks with due dates in your sheet.</Empty>}</section>
    </div>
    <section><h2>Subjects</h2>{data.subjects.length ? <Subjects list={data.subjects} tasks={tasks} /> : <Empty>No subjects yet. Add rows to the Subjects tab.</Empty>}</section>
  </>
}
const List = ({ tasks, subj }: { tasks: Task[]; subj: Map<string, Subject> }) => <ul className="list">{tasks.map(t =>
  <li key={t.id}><Dot s={subj.get(t.subjectId)} /><span className="grow"><b>{t.title}</b><small>{subj.get(t.subjectId)?.name ?? 'No subject'}</small></span><span className={'pill ' + (t.due < today() ? 'high' : '')}>{fmt(t.due)} · {rel(t.due)}</span></li>)}</ul>

function Tasks({ tasks, subj, setStatus }: { tasks: Task[]; subj: Map<string, Subject>; setStatus: (t: Task, s: Status) => void }) {
  const [f, setF] = useState<'all' | Status>('all'), [p, setP] = useState('all'), [sort, setSort] = useState<'due' | 'priority'>('due')
  const rank = { high: 0, medium: 1, low: 2 }
  const rows = tasks.filter(t => (f === 'all' || t.status === f) && (p === 'all' || t.priority === p))
    .sort((a, b) => sort === 'due' ? (a.due || '9').localeCompare(b.due || '9') : rank[a.priority] - rank[b.priority])
  return <section><h1>Tasks</h1>
    <div className="filters">
      <label>Status <select value={f} onChange={e => setF(e.target.value as typeof f)}><option value="all">All</option><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select></label>
      <label>Priority <select value={p} onChange={e => setP(e.target.value)}><option value="all">All</option><option>high</option><option>medium</option><option>low</option></select></label>
      <label>Sort by <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="due">Due date</option><option value="priority">Priority</option></select></label>
    </div>
    <p className="hint">Status changes are saved in this browser only. Edit the spreadsheet to change them for everyone.</p>
    {rows.length ? <TaskRows rows={rows} subj={subj} setStatus={setStatus} /> : <Empty>No tasks match these filters.</Empty>}</section>
}
const TaskRows = ({ rows, subj, setStatus }: { rows: Task[]; subj: Map<string, Subject>; setStatus: (t: Task, s: Status) => void }) =>
  <ul className="list">{rows.map(t => <li key={t.id} className={t.status === 'done' ? 'done' : ''}>
    <Dot s={subj.get(t.subjectId)} />
    <span className="grow"><b>{t.title}</b><small>{subj.get(t.subjectId)?.name ?? 'No subject'}{t.description ? ' · ' + t.description : ''}</small></span>
    <span className={'pill ' + t.priority}>{t.priority}</span>
    <span className="pill">{t.due ? fmt(t.due) : 'No date'}</span>
    <select aria-label={`Status of ${t.title}`} value={t.status} onChange={e => setStatus(t, e.target.value as Status)}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select>
  </li>)}</ul>

function Calendar({ data, tasks, subj, match }: { data: Data; tasks: Task[]; subj: Map<string, Subject>; match: (...f: string[]) => boolean }) {
  type Ev = { date: string; time: string; label: string; kind: string; sid: string }
  const evs: Ev[] = [
    ...tasks.filter(t => t.due && t.status !== 'done').map(t => ({ date: t.due, time: '', label: t.title, kind: 'Deadline', sid: t.subjectId })),
    ...data.exams.map(e => ({ date: e.date, time: '', label: e.title, kind: 'Exam', sid: e.subjectId })),
  ].filter(e => match(e.label, subj.get(e.sid)?.name ?? '')).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const days = [...new Set(evs.map(e => e.date))]
  return <section><h1>Calendar</h1>{days.length ? days.map(d => <div key={d} className="day"><h2 className={d < today() ? 'past' : d === today() ? 'now' : ''}>{fmt(d)} <small>{rel(d)}</small></h2>
    <ul className="list">{evs.filter(e => e.date === d).map((e, i) => <li key={i}><Dot s={subj.get(e.sid)} /><span className="grow"><b>{e.label}</b><small>{subj.get(e.sid)?.name ?? ''}</small></span><span className="pill">{e.time || e.kind}{e.time ? ' · ' + e.kind : ''}</span></li>)}</ul></div>) : <Empty>Nothing scheduled. Add deadlines, sessions or exams in your sheet.</Empty>}</section>
}

function Subjects({ list, tasks }: { list: Subject[]; tasks: Task[] }) {
  if (!list.length) return <Empty>No subjects found.</Empty>
  return <div className="grid">{list.map(s => { const ts = tasks.filter(t => t.subjectId === s.id), d = ts.filter(t => t.status === 'done').length
    return <a key={s.id} className="card" href={`#/subject/${s.id}`} style={{ borderTopColor: s.color }}>
      <h3>{s.name}</h3><small>{[s.category, s.semester].filter(Boolean).join(' · ')}</small><p>{s.description}</p>{ts.length > 0 && <small>{d}/{ts.length} tasks done</small>}</a> })}</div>
}
function SubjectPage({ s, data, tasks, setStatus }: { s?: Subject; data: Data; tasks: Task[]; setStatus: (t: Task, s: Status) => void }) {
  if (!s) return <Empty>Subject not found. It may have been removed from the spreadsheet.</Empty>
  const m = new Map([[s.id, s]]), res = data.resources.filter(r => r.subjectId === s.id)
  return <section><a href="#/subjects">← All subjects</a><h1><Dot s={s} /> {s.name}</h1>
    <p className="hint">{[s.instructor, s.category, s.semester].filter(Boolean).join(' · ')}</p><p>{s.description}</p>
    <h2>Tasks</h2>{tasks.some(t => t.subjectId === s.id) ? <TaskRows rows={tasks.filter(t => t.subjectId === s.id)} subj={m} setStatus={setStatus} /> : <Empty>No tasks for this subject.</Empty>}
    <h2>Resources</h2>{res.length ? <ResList items={res} /> : <Empty>No resources for this subject.</Empty>}
    {data.exams.filter(e => e.subjectId === s.id).map(e => <p key={e.id}><b>{e.title}</b> · {fmt(e.date)} {e.notes && '· ' + e.notes}</p>)}</section>
}
const ResList = ({ items }: { items: Data['resources'] }) => <ul className="list">{items.map(r => <li key={r.id}><span className="grow">
  {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer"><b>{r.title}</b></a> : <b>{r.title} <em className="warn-text">(link missing or invalid)</em></b>}
  <small>{[r.description, r.notes].filter(Boolean).join(' · ')}</small></span><span className="pill">{r.type}</span></li>)}</ul>
function Resources({ data, subj, match }: { data: Data; subj: Map<string, Subject>; match: (...f: string[]) => boolean }) {
  const [type, setType] = useState('all')
  const types = [...new Set(data.resources.map(r => r.type))]
  const items = data.resources.filter(r => (type === 'all' || r.type === type) && match(r.title, r.description, r.type, subj.get(r.subjectId)?.name ?? ''))
  const groups = [...new Set(items.map(r => r.subjectId))]
  return <section><h1>Resources</h1>
    <div className="filters"><label>Type <select value={type} onChange={e => setType(e.target.value)}><option value="all">All</option>{types.map(t => <option key={t}>{t}</option>)}</select></label></div>
    {groups.length ? groups.map(g => <div key={g}><h2><Dot s={subj.get(g)} /> {subj.get(g)?.name ?? 'Unassigned'}</h2><ResList items={items.filter(r => r.subjectId === g)} /></div>) : <Empty>No resources found.</Empty>}</section>
}

const byTime = (a: Session, b: Session) => mins(a.start) - mins(b.start)
const ClassRows = ({ items, subj }: { items: Session[]; subj: Map<string, Subject> }) => <ul className="list">{[...items].sort(byTime).map(x =>
  <li key={x.id}><Dot s={subj.get(x.subjectId)} /><span className="grow"><b>{subj.get(x.subjectId)?.name ?? 'Class'}</b><small>{[x.type, x.location].filter(Boolean).join(' · ')}</small></span><span className="pill">{x.start || 'Time TBA'}{x.end ? '–' + x.end : ''}</span></li>)}</ul>
function Today({ sessions, subj }: { sessions: Session[]; subj: Map<string, Subject> }) {
  const t = sessions.filter(x => x.day === new Date().getDay())
  return <section><h2>Today’s classes</h2>{t.length ? <ClassRows items={t} subj={subj} /> : <Empty>No classes today.</Empty>}<p><a href="#/timetable">See the full timetable</a></p></section>
}
function Timetable({ sessions, subj }: { sessions: Session[]; subj: Map<string, Subject> }) {
  const days = WEEK_ORDER.filter(d => sessions.some(x => x.day === d))
  return <section><h1>Timetable</h1>{days.length ? days.map(d => <div key={d} className="day"><h2 className={d === new Date().getDay() ? 'now' : ''}>{DAY[d]}{d === new Date().getDay() && <small> today</small>}</h2><ClassRows items={sessions.filter(x => x.day === d)} subj={subj} /></div>) : <Empty>No classes found. Add rows to the Schedules tab.</Empty>}</section>
}
