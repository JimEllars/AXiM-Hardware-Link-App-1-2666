import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationSystem({ telemetry }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const newAlerts = [];
    if (telemetry.battery < 15) {
      newAlerts.push({ id: 'batt', text: 'CRITICAL_BATT_LEVEL', icon: FiIcons.FiBattery, color: 'text-rose-500' });
    }
    if (telemetry.temp > 85) {
      newAlerts.push({ id: 'temp', text: 'THERMAL_OVERLOAD_WARNING', icon: FiIcons.FiThermometer, color: 'text-orange-500' });
    }
    if (telemetry.ping > 300) {
      newAlerts.push({ id: 'ping', text: 'UPLINK_LATENCY_CRITICAL', icon: FiIcons.FiWifiOff, color: 'text-amber-500' });
    }
    setAlerts(newAlerts);
  }, [telemetry]);

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`flex items-center space-x-3 bg-black/80 border border-current px-4 py-2 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)] ${alert.color}`}
          >
            <SafeIcon icon={alert.icon} className="text-xl animate-pulse" />
            <span className="font-bold tracking-[0.2em] text-xs uppercase">{alert.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}