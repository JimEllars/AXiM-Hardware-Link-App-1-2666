import { useState, useEffect, useRef } from 'react';
import { logIncident } from '../services/hardwareService';
import { aximCoreClient } from '../lib/supabaseClient';

export function useTelemetryStream(deviceId) {
  const [isLinkStale, setIsLinkStale] = useState(false);
  const lastMessageTimestamp = useRef(Date.now());

  const [telemetry, setTelemetry] = useState({
    battery: 85,
    signal: -45,
    ping: 24,
    cpuLoad: 45,
    temp: 65,
    history: []
  });

  const activeAlerts = useRef(new Set());

  useEffect(() => {
    if (!deviceId) return;

    const historyLength = 20;

    // AXiM Core Realtime Telemetry Architecture:
    // We subscribe to a specific broadcast channel unique to the deviceId.
    // The Core macro-ecosystem broadcasts real-time hardware vitals via this channel.
    const channel = aximCoreClient.channel(`axim_core_telemetry:${deviceId}`);

    channel.on(
      'broadcast',
      { event: 'telemetry_update' },
      (payload) => {
        lastMessageTimestamp.current = Date.now();
        setIsLinkStale(false);
        const data = payload.payload;

        setTelemetry(prev => {
          const now = new Date().toLocaleTimeString('en-US', { hour12: false, second: '2-digit', minute: '2-digit', hour: '2-digit' });
          const newPoint = {
            time: now,
            cpu: Number(data.cpu).toFixed(1),
            temp: Number(data.temp).toFixed(1)
          };
          const newHistory = [...prev.history, newPoint].slice(-historyLength);

          const newBattery = Number(data.battery);
          const newTemp = Number(data.temp);

          // Check for Incident Triggers locally to reduce Core load for incident processing
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
            signal: Number(data.signal),
            ping: Number(data.ping),
            cpuLoad: Number(data.cpu),
            temp: newTemp,
            history: newHistory
          };
        });
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to telemetry stream for ${deviceId}`);
      }
    });


    const watchdogInterval = setInterval(() => {
      if (Date.now() - lastMessageTimestamp.current > 5000) {
        setIsLinkStale(true);
      }
    }, 2000);

    return () => {
      clearInterval(watchdogInterval);
      aximCoreClient.removeChannel(channel);
    };
  }, [deviceId]);

  return { ...telemetry, isLinkStale };
}
