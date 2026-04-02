'use client';

import { useEffect } from 'react';
import { startHealthCheck, stopHealthCheck } from '@/lib/healthService';

export default function HealthcheckProbe() {
  useEffect(() => {
    startHealthCheck();

    return () => {
      stopHealthCheck();
    };
  }, []);

  return null;
}
