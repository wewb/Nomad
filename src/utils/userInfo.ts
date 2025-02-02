import { UserInfo } from '../types'

/**
 * Get user browser information
 */
function getBrowserInfo(): { name: string; version: string } {
  const userAgent = navigator.userAgent
  let browserName = 'Unknown'
  let browserVersion = 'Unknown'

  if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/)
    browserVersion = match ? match[1] : 'Unknown'
  } else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/)
    browserVersion = match ? match[1] : 'Unknown'
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari'
    const match = userAgent.match(/Version\/(\d+\.\d+)/)
    browserVersion = match ? match[1] : 'Unknown'
  }

  return { name: browserName, version: browserVersion }
}

/**
 * Get operating system information
 */
function getOSInfo(): string {
  const userAgent = navigator.userAgent
  if (userAgent.indexOf('Windows') > -1) return 'Windows'
  if (userAgent.indexOf('Mac') > -1) return 'MacOS'
  if (userAgent.indexOf('Linux') > -1) return 'Linux'
  if (userAgent.indexOf('Android') > -1) return 'Android'
  if (userAgent.indexOf('iOS') > -1) return 'iOS'
  return 'Unknown'
}

/**
 * Get device type
 */
function getDeviceType(): string {
  const userAgent = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'Tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/.test(userAgent)) {
    return 'Mobile'
  }
  return 'Desktop'
}

/**
 * Get user information
 */
export function getUserInfo(): UserInfo {
  const browser = getBrowserInfo()
  
  return {
    browser: browser.name,
    browserVersion: browser.version,
    os: getOSInfo(),
    deviceType: getDeviceType(),
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
} 