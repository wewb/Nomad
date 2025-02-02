import { EventQueue } from './eventQueue'
import { getUserInfo } from './userInfo'

const errorQueue = new EventQueue()

/**
 * Setup global error capture
 */
export function setupErrorCapture(): void {
  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    const errorData = {
      event_name: 'js_error',
      event_params: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || 'Unknown error'
      },
      common_params: {},
      user_info: getUserInfo(),
      project_id: '',  // This will be set by the queue processor
      timestamp: Date.now()
    }
    
    errorQueue.add(errorData)
  })

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorData = {
      event_name: 'promise_error',
      event_params: {
        message: event.reason?.message || 'Promise rejection',
        stack: event.reason?.stack || 'Unknown stack'
      },
      common_params: {},
      user_info: getUserInfo(),
      project_id: '',
      timestamp: Date.now()
    }
    
    errorQueue.add(errorData)
  })
} 