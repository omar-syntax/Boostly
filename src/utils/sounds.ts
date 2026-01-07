// Sound file imports (using require or import based on build system, usually imports for Vite)
import dingSound from './ding.mp3'
import notificationSound from './new-notification.mp3'
import levelUpSound from './level-passed.mp3'

/**
 * Plays the task completion sound
 */
export function playCompletionSound() {
  try {
    const audio = new Audio(dingSound)
    audio.play().catch(e => console.error("Error playing completion sound:", e))
  } catch (error) {
    console.error("Audio playback failed:", error)
  }
}

/**
 * Plays the new notification sound
 */
export function playNotificationSound() {
  try {
    const audio = new Audio(notificationSound)
    audio.play().catch(e => console.error("Error playing notification sound:", e))
  } catch (error) {
    console.error("Audio playback failed:", error)
  }
}

/**
 * Plays the level up sound
 */
export function playLevelUpSound() {
  try {
    const audio = new Audio(levelUpSound)
    audio.play().catch(e => console.error("Error playing level up sound:", e))
  } catch (error) {
    console.error("Audio playback failed:", error)
  }
}

/**
 * Plays a success sound - keeping for compatibility or other uses
 * Currently mapped to completion sound for consistency, or we can keep the old synth
 */
export function playSuccessSound() {
  playCompletionSound()
}

