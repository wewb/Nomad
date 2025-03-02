"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const Event_1 = require("../models/Event");
async function seedData() {
    await (0, db_1.connectDB)();
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
    await Event_1.Event.insertMany(testEvents);
    console.log('Test data seeded successfully');
    process.exit(0);
}
seedData().catch(console.error);
