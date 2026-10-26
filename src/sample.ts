import type { Data } from './types'
const pad = (n: number) => String(n).padStart(2, '0')
const d = (n: number) => { const t = new Date(); t.setDate(t.getDate() + n); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}` }
/** DEMO DATA ONLY – shown when src/config.ts has no sheet URLs. Never mixed with live data. */
export const SAMPLE: Omit<Data, 'demo'> = {
  warnings: [],
  subjects: [
    { id: 'MATH201', name: 'Linear Algebra', category: 'Mathematics', color: '#0f766e', instructor: 'Dr. Amal', description: 'Vectors, matrices, eigenvalues.', semester: 'Fall 2026' },
    { id: 'CS210', name: 'Data Structures', category: 'Computer Science', color: '#b45309', instructor: 'Dr. Karim', description: 'Trees, graphs, hashing.', semester: 'Fall 2026' },
    { id: 'PHY101', name: 'Physics I', category: 'Science', color: '#4338ca', instructor: 'Dr. Salma', description: 'Mechanics and waves.', semester: 'Fall 2026' },
  ],
  tasks: [
    { id: 'T1', subjectId: 'MATH201', title: 'Problem set 4', description: 'Chapters 4–5', priority: 'high', status: 'todo', due: d(-2), completed: '' },
    { id: 'T2', subjectId: 'CS210', title: 'Implement a binary search tree', description: '', priority: 'high', status: 'in-progress', due: d(3), completed: '' },
    { id: 'T3', subjectId: 'PHY101', title: 'Lab report', description: 'Pendulum experiment', priority: 'medium', status: 'todo', due: d(6), completed: '' },
    { id: 'T4', subjectId: 'CS210', title: 'Read hashing chapter', description: '', priority: 'low', status: 'done', due: d(-5), completed: d(-6) },
  ],
  resources: [
    { id: 'R1', subjectId: 'MATH201', type: 'YouTube', title: 'Essence of Linear Algebra', url: 'https://www.youtube.com/@3blue1brown', description: 'Visual intuition', notes: '' },
    { id: 'R2', subjectId: 'CS210', type: 'Book', title: 'OpenDSA', url: 'https://opendsa-server.cs.vt.edu/', description: 'Free online textbook', notes: '' },
    { id: 'R3', subjectId: 'PHY101', type: 'Website', title: 'Resource with a bad link', url: '', description: 'Shows how invalid URLs are handled', notes: '' },
  ],
  sessions: [
    { id: 'S1', subjectId: 'CS210', day: 6, start: '10:00', end: '11:30', duration: 90, location: 'Hall A', type: 'Lecture' },
    { id: 'S2', subjectId: 'MATH201', day: 0, start: '12:00', end: '13:30', duration: 90, location: 'Room 204', type: 'Lecture' },
    { id: 'S3', subjectId: 'PHY101', day: 2, start: '09:00', end: '11:00', duration: 120, location: 'Lab 3', type: 'Lab' },
  ],
  exams: [{ id: 'E1', subjectId: 'MATH201', title: 'Midterm', date: d(12), notes: 'Chapters 1–6' }],
}
