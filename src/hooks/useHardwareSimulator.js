import { useEffect } from 'react';
import { getCommandHistory, updateCommandStatus } from '../services/hardwareService';

/**
 * MOCK HARDWARE SIMULATOR
 * This hook acts as the remote device. It polls the CommandQueue in Google Sheets
 * and marks PENDING commands as EXECUTED after a simulated latency period.
 */
export function useHardwareSimulator(deviceId) {
  useEffect(() => {
    const simulatorInterval = setInterval(async () => {
      try {
        const commands = await getCommandHistory(deviceId, 10);
        const pending = commands.filter(cmd => cmd.status === 'PENDING');
        
        for (const cmd of pending) {
          console.log(`[Simulator] Processing command: ${cmd.command}`);
          // Simulate hardware processing delay
          setTimeout(async () => {
            await updateCommandStatus(cmd.id, 'EXECUTED');
            console.log(`[Simulator] Command EXECUTED: ${cmd.id}`);
          }, 2000);
        }
      } catch (err) {
        console.warn('Simulator polling failed:', err);
      }
    }, 10000);

    return () => clearInterval(simulatorInterval);
  }, [deviceId]);
}