import { debug } from "./debug";

type EventType =
  "ready" | "check" | "select-alert" | "deselect-alert" | "alerts";

// Generic event handler type for type-safe event handling
type EventHandler<T = unknown> = (data: T) => void;

// The main purpose of the event bus is to issue commands to the React
// application.
export class EventBus {
  private subscribers: Record<string, EventHandler>;

  constructor() {
    this.subscribers = {};
  }

  on<T = unknown>(topic: EventType, cb: EventHandler<T>): () => void {
    debug(`Registering subscriber for topic "${topic}"`);
    // Subscribers are stored untyped; dispatch() callers pass the matching payload.
    this.subscribers[topic] = cb as EventHandler;

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
