import { EventData } from '../types'

const API_ENDPOINT = 'https://your-api-endpoint.com/track'

/**
 * Send events to server
 */
export async function sendToServer(events: EventData[]): Promise<void> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to send events:', error)
    throw error
  }
} 