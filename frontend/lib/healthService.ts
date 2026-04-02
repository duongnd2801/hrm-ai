'use client';

import { useEffect, useSyncExternalStore } from 'react';

type BackendStatus = 'READY' | 'NOT_READY' | 'UNKNOWN';
type DatabaseStatus = 'UP' | 'DOWN' | 'UNKNOWN';

export type HealthState = {
  healthy: boolean;
  status: BackendStatus;
  database: DatabaseStatus;
  lastCheckedAt: number | null;
  error: string | null;
};

const BASE_INTERVAL_MS = 60_000;
const MAX_INTERVAL_MS = 120_000;
const REQUEST_TIMEOUT_MS = 4_000;

const initialState: HealthState = {
  healthy: false,
  status: 'UNKNOWN',
  database: 'UNKNOWN',
  lastCheckedAt: null,
  error: null,
};

const listeners = new Set<() => void>();

let state: HealthState = initialState;
let started = false;
let active = false;
let timerId: number | null = null;
let abortController: AbortController | null = null;
let requestTimeoutId: number | null = null;
let currentIntervalMs = BASE_INTERVAL_MS;
let visibilityBound = false;

function getHealthUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8080';
  return `${baseUrl}/api/health/ready`;
}

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(nextState: HealthState) {
  state = nextState;
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.backendHealth = nextState.healthy ? 'ready' : 'down';
  }
  notify();
}

function clearScheduledRun() {
  if (timerId !== null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
}

function clearActiveRequest() {
  if (requestTimeoutId !== null) {
    window.clearTimeout(requestTimeoutId);
    requestTimeoutId = null;
  }
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

function scheduleNext(delayMs: number) {
  clearScheduledRun();
  if (!active) return;
  timerId = window.setTimeout(() => {
    void runHealthCheck();
  }, delayMs);
}

function logDown(message: string) {
  console.error(`[healthcheck] ${message}`);
}

async function runHealthCheck() {
  if (!active) return;

  clearActiveRequest();
  const controller = new AbortController();
  abortController = controller;
  requestTimeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getHealthUrl(), {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    const payload = (await response.json()) as Partial<HealthState>;
    const status = payload.status === 'READY' ? 'READY' : 'NOT_READY';
    const database = payload.database === 'UP' ? 'UP' : 'DOWN';
    const healthy = response.ok && status === 'READY' && database === 'UP';

    if (!healthy) {
      logDown(`Backend not ready: status=${status}, database=${database}`);
    }

    currentIntervalMs = BASE_INTERVAL_MS;
    setState({
      healthy,
      status,
      database,
      lastCheckedAt: Date.now(),
      error: healthy ? null : `status=${status}, database=${database}`,
    });
    scheduleNext(BASE_INTERVAL_MS);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Health check request failed';
    logDown(`Health check failed: ${message}`);
    currentIntervalMs = Math.min(currentIntervalMs * 2, MAX_INTERVAL_MS);
    setState({
      healthy: false,
      status: 'UNKNOWN',
      database: 'UNKNOWN',
      lastCheckedAt: Date.now(),
      error: message,
    });
    scheduleNext(currentIntervalMs);
  } finally {
    if (requestTimeoutId !== null) {
      window.clearTimeout(requestTimeoutId);
      requestTimeoutId = null;
    }
    abortController = null;
  }
}

function handleVisibilityChange() {
  const visible = !document.hidden;
  active = visible;

  if (!visible) {
    clearScheduledRun();
    clearActiveRequest();
    return;
  }

  currentIntervalMs = BASE_INTERVAL_MS;
  void runHealthCheck();
}

export function startHealthCheck() {
  if (typeof window === 'undefined' || started) return;

  started = true;
  active = !document.hidden;

  if (!visibilityBound) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityBound = true;
  }

  if (active) {
    void runHealthCheck();
  }
}

export function stopHealthCheck() {
  if (typeof window === 'undefined') return;
  active = false;
  clearScheduledRun();
  clearActiveRequest();
}

export function subscribeHealth(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getHealthSnapshot() {
  return state;
}

export function useHealthCheck() {
  useEffect(() => {
    startHealthCheck();
  }, []);

  return useSyncExternalStore(subscribeHealth, getHealthSnapshot, getHealthSnapshot);
}
