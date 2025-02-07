import { Router } from 'express';
import { Event } from '../models/Event';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const eventData = req.body;
    const event = new Event(eventData);
    await event.save();
    res.status(201).json({ message: 'Event recorded successfully' });
  } catch (error) {
    console.error('Failed to save event:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { projectId, eventName, startDate, endDate } = req.query;
    
    const query: any = {};
    if (projectId) query.projectId = projectId;
    if (eventName) query.eventName = eventName;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const stats = await Event.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            eventName: '$eventName',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export const trackRouter = router; 