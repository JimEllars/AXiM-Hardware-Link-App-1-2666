import { useState, useEffect, useRef } from 'react';
import { logTelemetry, logIncident } from '../services/hardwareService';

export function useTelemetryStream(deviceId) {
  const [telemetry, setTelemetry] = useState({
    battery: 85,
    signal: -45,
    ping: 24,
    cpuLoad: 45,
    temp: 65,
    history: []
  });

  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;
  
  // Track active alerts to prevent duplicate database logging
  const activeAlerts = useRef(new Set());

  useEffect(() => {
    const historyLength = 20;
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const newBattery = Math.max(0, prev.battery - (Math.random() > 0.9 ? 1 : 0));
        const newSignal = -40 - Math.floor(Math.random() * 30);
        const newPing = 20 + Math.floor(Math.random() * 80) + (Math.random() > 0.95 ? 200 : 0);
        const newCpu = Math.min(100, Math.max(10, prev.cpuLoad + (Math.random() * 20 - 10)));
        const newTemp = Math.min(120, Math.max(40, prev.temp + (Math.random() * 4 - 2)));
        
        const now = new Date().toLocaleTimeString('en-US', { hour12: false, second: '2-digit', minute: '2-digit', hour: '2-digit' });
        const newPoint = { time: now, cpu: newCpu.toFixed(1), temp: newTemp.toFixed(1) };
        const newHistory = [...prev.history, newPoint].slice(-historyLength);

        // Check for Incident Triggers
        if (newBattery < 10 && !activeAlerts.current.has('LOW_BATT')) {
          logIncident(deviceId, { type: 'POWER_FAILURE', severity: 'CRITICAL', message: 'Battery level reached critical threshold (<10%)' });
          activeAlerts.current.add('LOW_BATT');
        } else if (newBattery >= 10) {
          activeAlerts.current.delete('LOW_BATT');
        }

        if (newTemp > 90 && !activeAlerts.current.has('HIGH_TEMP')) {
          logIncident(deviceId, { type: 'THERMAL_BREACH', severity: 'CRITICAL', message: 'Core temperature exceeded safe operating limit (>90C)' });
          activeAlerts.current.add('HIGH_TEMP');
        } else if (newTemp <= 90) {
          activeAlerts.current.delete('HIGH_TEMP');
        }

        return {
          battery: newBattery,
          signal: newSignal,
          ping: newPing,
          cpuLoad: newCpu,
          temp: newTemp,
          history: newHistory
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [deviceId]);

  useEffect(() => {
    const syncInterval = setInterval(() => {
      const current = telemetryRef.current;
      logTelemetry(deviceId, {
        battery: current.battery,
        signal: current.signal,
        ping: current.ping,
        cpu: current.cpuLoad,
        temp: current.temp
      }).catch(err => console.warn('Sync Failed:', err));
    }, 15000);

    return () => clearInterval(syncInterval);
  }, [deviceId]);

  return telemetry;
}