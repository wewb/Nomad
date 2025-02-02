import { Config, CommonParams, EventParams } from './types'
import { getUserInfo } from './utils/userInfo'
import { setupErrorCapture } from './utils/errorCapture'
import { EventQueue } from './utils/eventQueue'

let config: Config | null = null
let commonParams: CommonParams = {}
const eventQueue = new EventQueue()

/**
 * Register and initialize the SDK
 */
export function register(conf: Config): void {
  config = {
    projectId: conf.projectId,
    uploadPercent: conf.uploadPercent || 1,
    maxRequests: conf.maxRequests || 10,
    queueWaitTime: conf.queueWaitTime || 1000
  }
  
  // Initialize error capture
  setupErrorCapture()
  
  // Start queue processing
  eventQueue.startProcessing()
}

/**
 * Add common parameters that will be included in all events
 */
export function addCommonParams(params: CommonParams): void {
  commonParams = { ...commonParams, ...params }
}

/**
 * Send tracking event
 */
export function sendEvent(eventName: string, params: EventParams): void {
  if (!config) {
    throw new Error('SDK not initialized. Call register() first')
  }

  // Check sampling
  if (Math.random() > (config.uploadPercent ?? 1)) {
    return
  }

  const eventData = {
    event_name: eventName,
    event_params: params,
    common_params: commonParams,
    user_info: getUserInfo(),
    timestamp: Date.now(),
    project_id: config.projectId
  }

  eventQueue.add(eventData)
}

export * from './types' 