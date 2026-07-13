import { useState, useEffect, useRef } from 'react';
import { logIncident } from '../services/hardwareService';
import { aximCoreClient } from '../lib/supabaseClient';

export function useTelemetryStream(deviceId) {
  const [isLinkStale, setIsLinkStale] = useState(false);
  const [wsStatus, setWsStatus] = useState('CONNECTING');
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

    setWsStatus('CONNECTING');

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
        const data = payload?.payload || {};

        setTelemetry(prev => {
          const now = new Date().toLocaleTimeString('en-US', { hour12: false, second: '2-digit', minute: '2-digit', hour: '2-digit' });

          const safeCpu = Number(data.cpu) || 0;
          const safeTemp = Number(data.temp) || 0;
          const safeBattery = Number(data.battery) || 100;
          const safeSignal = data.signal !== undefined && data.signal !== null ? Number(data.signal) : -45;
          const safePing = data.ping !== undefined && data.ping !== null ? Number(data.ping) : 24;

          const newPoint = {
            time: now,
            cpu: safeCpu.toFixed(1),
            temp: safeTemp.toFixed(1)
          };
          const newHistory = [...prev.history, newPoint].slice(-historyLength);

          // Check for Incident Triggers locally to reduce Core load for incident processing
          if (safeBattery < 10 && !activeAlerts.current.has('LOW_BATT')) {
            logIncident(deviceId, { type: 'POWER_FAILURE', severity: 'CRITICAL', message: 'Battery level reached critical threshold (<10%)' });
            activeAlerts.current.add('LOW_BATT');
          } else if (safeBattery >= 10) {
            activeAlerts.current.delete('LOW_BATT');
          }

          if (safeTemp > 90 && !activeAlerts.current.has('HIGH_TEMP')) {
            logIncident(deviceId, { type: 'THERMAL_BREACH', severity: 'CRITICAL', message: 'Core temperature exceeded safe operating limit (>90C)' });
            activeAlerts.current.add('HIGH_TEMP');
          } else if (safeTemp <= 90) {
            activeAlerts.current.delete('HIGH_TEMP');
          }

          return {
            battery: safeBattery,
            signal: safeSignal,
            ping: safePing,
            cpuLoad: safeCpu,
            temp: safeTemp,
            history: newHistory
          };
        });
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setWsStatus('CONNECTED');
        console.log(`Subscribed to telemetry stream for ${deviceId}`);
      } else if (status === 'TIMED_OUT') {
        setWsStatus('DISCONNECTED');
      } else if (status === 'CHANNEL_ERROR') {
        setWsStatus('ERROR');
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

  return { ...telemetry, isLinkStale, wsStatus };
}
