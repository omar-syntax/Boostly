export interface SessionTemplate {
  id: string
  name: string
  description: string
  workDuration: number // in minutes
  shortBreakDuration: number // in minutes
  longBreakDuration: number // in minutes
  sessionsUntilLongBreak: number
  category: 'classic' | 'extended' | 'custom'
  pointsPerWorkSession: number
  pointsPerShortBreak: number
  pointsPerLongBreak: number
}

export const sessionTemplates: SessionTemplate[] = [
  {
    id: 'classic-pomodoro',
    name: 'Classic Pomodoro',
    description: 'Traditional 25-minute focus sessions with short breaks',
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    category: 'classic',
    pointsPerWorkSession: 50,
    pointsPerShortBreak: 10,
    pointsPerLongBreak: 15
  },
  {
    id: 'extended-pomodoro',
    name: 'Extended Pomodoro',
    description: '50-minute focus sessions for deep work',
    workDuration: 50,
    shortBreakDuration: 10,
    longBreakDuration: 30,
    sessionsUntilLongBreak: 4,
    category: 'extended',
    pointsPerWorkSession: 100,
    pointsPerShortBreak: 20,
    pointsPerLongBreak: 30
  },
  {
    id: 'ultradian-rhythm',
    name: 'Ultradian Rhythm',
    description: '90-minute focus sessions aligned with natural brain cycles',
    workDuration: 90,
    shortBreakDuration: 20,
    longBreakDuration: 45,
    sessionsUntilLongBreak: 3,
    category: 'extended',
    pointsPerWorkSession: 180,
    pointsPerShortBreak: 40,
    pointsPerLongBreak: 60
  },
  {
    id: 'timeboxing',
    name: 'Timeboxing',
    description: '45-minute focused work blocks with moderate breaks',
    workDuration: 45,
    shortBreakDuration: 8,
    longBreakDuration: 20,
    sessionsUntilLongBreak: 4,
    category: 'extended',
    pointsPerWorkSession: 90,
    pointsPerShortBreak: 16,
    pointsPerLongBreak: 25
  },
  {
    id: 'sprint-method',
    name: 'Sprint Method',
    description: '75-minute intense work sessions for complex tasks',
    workDuration: 75,
    shortBreakDuration: 15,
    longBreakDuration: 35,
    sessionsUntilLongBreak: 3,
    category: 'extended',
    pointsPerWorkSession: 150,
    pointsPerShortBreak: 30,
    pointsPerLongBreak: 50
  },
  {
    id: 'micro-focus',
    name: 'Micro Focus',
    description: '15-minute quick sessions for small tasks',
    workDuration: 15,
    shortBreakDuration: 3,
    longBreakDuration: 8,
    sessionsUntilLongBreak: 6,
    category: 'classic',
    pointsPerWorkSession: 30,
    pointsPerShortBreak: 6,
    pointsPerLongBreak: 10
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    description: '120-minute extended sessions for complex projects',
    workDuration: 120,
    shortBreakDuration: 25,
    longBreakDuration: 60,
    sessionsUntilLongBreak: 2,
    category: 'extended',
    pointsPerWorkSession: 240,
    pointsPerShortBreak: 50,
    pointsPerLongBreak: 80
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Set your own session durations',
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    category: 'custom',
    pointsPerWorkSession: 50,
    pointsPerShortBreak: 10,
    pointsPerLongBreak: 15
  }
]

export const getDefaultTemplate = (): SessionTemplate => {
  return sessionTemplates.find(t => t.id === 'classic-pomodoro')!
}

export const getTemplateById = (id: string): SessionTemplate | undefined => {
  return sessionTemplates.find(t => t.id === id)
}

export const getTemplatesByCategory = (category: 'classic' | 'extended' | 'custom') => {
  return sessionTemplates.filter(t => t.category === category)
}
