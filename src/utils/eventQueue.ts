import { EventData } from '../types'
import { sendToServer } from './request'

export class EventQueue {
  private queue: EventData[] = []
  private processing = false
  private maxBatchSize = 10
  private batchTimeout = 1000 // 1 second

  /**
   * Add event to queue
   */
  public add(event: EventData): void {
    this.queue.push(event)
    
    if (!this.processing) {
      this.startProcessing()
    }
  }

  /**
   * Start processing queue
   */
  public startProcessing(): void {
    if (this.processing) return
    
    this.processing = true
    this.processQueue()
  }

  /**
   * Process queue items
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxBatchSize)
      
      try {
        await sendToServer(batch)
      } catch (error) {
        console.error('Failed to send events:', error)
        // Add failed events back to queue
        this.queue.unshift(...batch)
        await new Promise(resolve => setTimeout(resolve, this.batchTimeout))
      }
    }
    
    this.processing = false
  }
} 