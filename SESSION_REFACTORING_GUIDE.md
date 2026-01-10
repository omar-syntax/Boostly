# Session-Based Timer Refactoring

## 🎯 **Architecture Overview**

The refactored timer is now a **true session-based Pomodoro system** instead of a simple countdown timer.

### **Core Components**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   SessionCore   │───▶│   TimerEngine    │───▶│   UISettings    │
│ (State Machine) │    │ (Timestamps)    │    │ (Circular UI)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Persistence   │    │  SideEffects     │    │   ProgressRing  │
│ (LocalStorage)  │    │ (Sound, Points)  │    │ (SVG Progress)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔄 **Session Flow**

1. **User starts a session** (not a timer)
2. **Session runs automatically** based on timestamps
3. **Auto-progression**: Focus → Short Break → Focus → ... → Long Break → Focus
4. **Session cannot be resized/skipped** once started
5. **Persistent across refreshes** using localStorage + timestamps

## 📁 **File Structure**

```
src/
├── hooks/
│   └── useSessionCore/
│       ├── types.ts              # Type definitions
│       ├── SessionCore.ts        # Core state machine
│       ├── useSessionEngine.ts   # Timer engine (timestamps)
│       └── index.ts              # Public hook interface
├── components/
│   └── ui/
│       └── CircularProgress.tsx  # Circular progress UI
├── hooks/
│   └── useSessionSideEffects.ts  # Sound, points, database
└── pages/
    └── Focus-New.tsx             # Refactored Focus page
```

## 🚀 **Key Features**

### **✅ Deterministic & Bug-Safe**
- Timestamp-based calculations (no timer drift)
- Automatic completion detection
- Page visibility handling
- Robust state restoration

### **✅ Session-Based Logic**
- Fixed session durations (configurable)
- Automatic break scheduling
- Session counter (1/4, 2/4, etc.)
- No manual timer control

### **✅ Circular Progress UI**
- Beautiful SVG progress ring
- Color-coded session types
- Completion states
- Responsive design

### **✅ Robust Persistence**
- localStorage for current session
- Database for completed sessions
- Prevents duplicate completions
- Handles page refreshes/minimizes

## 🎮 **Usage**

```typescript
// Initialize session core
const session = useSessionCore({
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4
})

// Handle side effects
useSessionSideEffects({
  state: session.state,
  soundEnabled: true
})

// UI Controls
session.startSession()        // Start current session
session.completeSession()     // Complete manually
session.skipToNextSession()   // Skip to next (only when idle)
session.resetSession()        // Reset everything
```

## 🔄 **State Management**

```typescript
interface SessionData {
  sessionType: 'focus' | 'shortBreak' | 'longBreak'
  sessionStatus: 'idle' | 'running' | 'completed'
  sessionNumber: number        // Current session (1-based)
  completedSessions: number     // Total completed focus sessions
  sessionStartTime: number | null
  sessionEndTime: number | null
  timeLeft: number             // Seconds remaining
  config: SessionConfig
}
```

## 🎨 **UI States**

- **Focus Session**: Blue primary color
- **Short Break**: Green success color  
- **Long Break**: Gray secondary color
- **Completed**: Checkmark with success message

## 🔧 **Migration Notes**

### **Database Changes Required**
Add these columns to `focus_sessions` table:
- `session_type` (text): 'focus', 'shortBreak', 'longBreak'
- `session_number` (integer): Session number in cycle

### **Breaking Changes**
- Old `useFocusTimer` hook → New `useSessionCore`
- Linear progress → Circular progress
- Manual duration control → Fixed session durations
- Session state names updated

## 🎯 **Benefits**

1. **True Pomodoro Experience** - Sessions, not timers
2. **No Timer Drift** - Timestamp-based calculations
3. **Persistent State** - Survives refreshes/crashes
4. **Clean Architecture** - Separated concerns
5. **Beautiful UI** - Circular progress indicators
6. **Auto-Progression** - Hands-free session flow
7. **Robust Testing** - Deterministic behavior

## 🚦 **Getting Started**

1. Replace `Focus.tsx` with `Focus-New.tsx`
2. Add database migration for new columns
3. Update any imports to use new hooks
4. Test session flow and persistence
5. Customize session durations as needed

The new system provides a **professional, reliable Pomodoro experience** that just works! 🍅
