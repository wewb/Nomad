import { EventName } from './types.js';
export { trackPoint, register, addCommonParams } from './track-point.js';
export { EventName } from './types.js';
export declare const sendEvent: (eventName: EventName, params: import("./types.js").EventParams) => Promise<void>;
export declare function initErrorTracking(projectId: string): void;
