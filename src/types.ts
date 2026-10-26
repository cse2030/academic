export type Status = 'todo' | 'in-progress' | 'done'
export type Priority = 'high' | 'medium' | 'low'
export interface Subject { id: string; name: string; category: string; color: string; instructor: string; description: string; semester: string }
export interface Task { id: string; subjectId: string; title: string; description: string; priority: Priority; status: Status; due: string; completed: string }
export interface Resource { id: string; subjectId: string; type: string; title: string; url: string; description: string; notes: string }
export interface Session { id: string; subjectId: string; day: number; start: string; end: string; duration: number; location: string; type: string }
export interface Exam { id: string; subjectId: string; title: string; date: string; notes: string }
export interface Data { subjects: Subject[]; tasks: Task[]; resources: Resource[]; sessions: Session[]; exams: Exam[]; warnings: string[]; demo: boolean }
