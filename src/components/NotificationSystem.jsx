import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { aximCoreClient } from '../lib/supabaseClient';

export function NotificationSystem() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const channel = aximCoreClient
      .channel('support-tickets-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_tickets' },
        (payload) => {
          const newTicket = payload.new || {};
          const id = newTicket.id || `alert-${Date.now()}`;
          const title = newTicket.title || 'UNKNOWN_ALERT';
          const severity = newTicket.severity || 'UNKNOWN';
          const status = newTicket.status || 'open';

          setAlerts((prev) => [...prev, {
            id,
            title,
            severity,
            status
          }]);
        }
      )
      .subscribe();

    return () => {
      aximCoreClient.removeChannel(channel);
    };
  }, []);

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => {
          let styling = 'border-gray-500 text-gray-500';
          let icon = FiIcons.FiInfo;

          if (alert.severity === 'CRITICAL') {
            styling = 'border-pink-500 animate-pulse text-pink-500';
            icon = FiIcons.FiAlertOctagon;
          } else if (alert.severity === 'WARNING') {
            styling = 'border-amber-500 text-amber-500';
            icon = FiIcons.FiAlertTriangle;
          }

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => dismissAlert(alert.id)}
              className={`flex items-center space-x-3 bg-black/80 border px-4 py-2 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-auto cursor-pointer ${styling}`}
            >
              <SafeIcon icon={icon} className="text-xl" />
              <span className="font-bold tracking-[0.2em] text-xs uppercase">{alert.title}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
