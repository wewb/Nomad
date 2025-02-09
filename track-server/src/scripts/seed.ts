import { connectDB } from '../db';
import { Event } from '../models/Event';

async function seedData() {
  await connectDB();

  const testEvents = [
    {
      projectId: 'test-project',
      eventName: 'click_event',
      eventParams: new Map([['buttonId', 'submit']]),
      userEnvInfo: {
        browserName: 'Chrome',
        osName: 'Windows',
        uid: 'user1',
        timestamp: Date.now()
      }
    },
    {
      projectId: 'test-project',
      eventName: 'page_view_event',
      eventParams: new Map([['path', '/home']]),
      userEnvInfo: {
        browserName: 'Firefox',
        osName: 'MacOS',
        uid: 'user2',
        timestamp: Date.now()
      }
    }
  ];

  await Event.insertMany(testEvents);
  console.log('Test data seeded successfully');
  process.exit(0);
}

seedData().catch(console.error); 