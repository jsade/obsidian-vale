import { debug } from "./debug";

type EventType =
  | "ready"
  | "check"
  | "select-alert"
  | "deselect-alert"
  | "alerts";

// Generic event handler type for type-safe event handling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler<T = any> = (data: T) => void;

// The main purpose of the event bus is to issue commands to the React
// application.
export class EventBus {
  private subscribers: Record<string, EventHandler>;

  constructor() {
    this.subscribers = {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on<T = any>(topic: EventType, cb: EventHandler<T>): () => void {
    debug(`Registering subscriber for topic "${topic}"`);
    this.subscribers[topic] = cb;

    return () => {
      debug(`Unregistering subscriber for topic "${topic}"`);
      delete this.subscribers[topic];
    };
  }

  dispatch<T>(topic: string, msg: T): void {
    debug(`Dispatched event on topic "${topic}"`);

    const cb = this.subscribers[topic];
    if (cb) {
      cb(msg);
    } else {
      console.warn("Dispatched event has no subscriber:", topic);
    }
  }
}
