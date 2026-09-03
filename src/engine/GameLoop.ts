/**
 * Centralized game-loop tick using a single requestAnimationFrame driving
 * multiple systems with independent cadences (accumulator pattern).
 *
 * Replaces the scattered React `setInterval` timers (day/night, combo, dash,
 * attack cooldown, mob AI) with one synchronised loop. Systems register with a
 * target interval (ms); the loop accumulates deltaTime and fires each system's
 * callback only when its interval has elapsed — with bounded catch-up to avoid
 * spiral-of-death after a long frame (e.g. tab switch).
 */

export interface GameLoopSystem {
  id: string;
  /** Target cadence in milliseconds (>=1). */
  interval: number;
  /**
   * Called when the accumulated time for this system reaches `interval`.
   * `dt` is the elapsed time (in seconds) since the previous callback for
   * THIS system (i.e. interval/1000, capped). Use for frame-rate independence.
   */
  callback: (dt: number, now: number) => void;
}

const MAX_FRAME_DELTA = 0.05; // clamp a single frame to 50ms (matches renderer)
const MAX_CATCHUP = 0.25; // don't run more than 250ms of catch-up in one pass

export class GameLoop {
  private systems: Map<string, {
    interval: number;
    accumulator: number;
    callback: (dt: number, now: number) => void;
  }> = new Map();

  private rafId: number | null = null;
  private lastTime: number = 0;
  private started = false;

  /** Register (or re-register) a system with its target cadence. */
  public register(id: string, interval: number, callback: (dt: number, now: number) => void): void {
    const existing = this.systems.get(id);
    if (existing) {
      existing.interval = interval;
      existing.callback = callback;
      return;
    }
    this.systems.set(id, { interval: Math.max(1, interval), accumulator: 0, callback });
  }

  public unregister(id: string): void {
    this.systems.delete(id);
  }

  public has(id: string): boolean {
    return this.systems.has(id);
  }

  public start(): void {
    if (this.started) return;
    this.started = true;
    this.lastTime = performance.now();
    const tick = (now: number) => {
      if (!this.started) return;
      this.rafId = requestAnimationFrame(tick);

      let delta = (now - this.lastTime) / 1000;
      this.lastTime = now;
      if (delta > MAX_FRAME_DELTA) delta = MAX_FRAME_DELTA;
      if (delta < 0) delta = 0;

      this.systems.forEach((sys) => {
        sys.accumulator += delta;
        const intervalSec = sys.interval / 1000;
        let guard = 0;
        while (sys.accumulator >= intervalSec && guard < Math.ceil(MAX_CATCHUP / intervalSec)) {
          sys.accumulator -= intervalSec;
          sys.callback(intervalSec, now);
          guard++;
        }
        if (guard >= Math.ceil(MAX_CATCHUP / intervalSec)) {
          // Drop accumulated backlog to avoid burst processing after long stalls.
          sys.accumulator = 0;
        }
      });
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public stop(): void {
    this.started = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public dispose(): void {
    this.stop();
    this.systems.clear();
  }
}
