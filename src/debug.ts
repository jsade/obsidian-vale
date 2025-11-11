// Enable debug logging when NODE_ENV is development or when explicitly enabled
const DEBUG =
  process.env.NODE_ENV === "development" || process.env.DEBUG === "true";

export const timed = <T>(label: string, cb: () => Promise<T>): Promise<T> => {
  if (DEBUG) {
    console.debug(label + " started");
    const start = performance.now();
    const res = cb().finally(() => {
      const duration = performance.now() - start;
      console.debug(label + " finished in " + duration.toFixed(2) + "ms");
    });
    return res;
  }
  return cb();
};

export const debug = (msg: string): void => {
  if (DEBUG) {
    console.debug(msg);
  }
};
