import React, { useRef } from 'react';
import { useHardwareVideoStream } from '../hooks/useHardwareVideoStream';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { inspectVideoFrameWithWorkersAi, dispatchTelemetryIngress } from '../services/hardwareService';

export function WebRTCVideoLayer({ deviceId }) {
  const { videoRef, status } = useHardwareVideoStream(deviceId);
  const lastScanDispatchTimestamp = useRef(0);

  const handleScan = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        console.log('Sending frame to Workers AI Vision...');
        const result = await inspectVideoFrameWithWorkersAi(deviceId, blob);
        console.log('Vision Scan Result:', result);

        if (result && result.analysis) {
          const { anomaly_detected, description } = result.analysis;
          const isDamageKeyword = description && /damage|smoke|anomaly|structural/i.test(description);

          if (anomaly_detected === true || isDamageKeyword) {
            const nowTime = Date.now();
            if (nowTime - lastScanDispatchTimestamp.current >= 60000) {
              dispatchTelemetryIngress(deviceId, {
                alert_type: 'OPTICAL_DAMAGE_DETECTED',
                details: result.analysis
              }).catch(console.error);
              lastScanDispatchTimestamp.current = nowTime;
            }
          }
        }
      }
    }, 'image/png');
  };


  return (
    <div className="absolute inset-0 z-0 bg-gray-900 flex items-center justify-center overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
      />

      {/* Aesthetic Overlays */}
      <div className="absolute inset-0 cyber-scanlines z-10 opacity-30"></div>
      
      {/* Target Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-40">
        <div className="w-64 h-64 border border-cyan-500/50 rounded-full relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-500/50"></div>
          <div className="absolute left-1/2 top-0 w-[1px] h-full bg-cyan-500/50"></div>
          <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-cyan-400 rounded-sm transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      {/* Status Overlay */}
      {status !== 'connected' && (
        <div className="absolute z-20 flex flex-col items-center justify-center cyber-panel p-8">
          <SafeIcon icon={FiIcons.FiRadio} className={`text-4xl mb-4 ${status === 'error' ? 'text-rose-500' : 'text-cyan-500 animate-pulse'}`} />
          <h2 className={`font-bold tracking-widest text-xl mb-2 ${status === 'error' ? 'text-rose-500' : 'text-cyan-500'}`}>
            {status === 'error' ? 'WEBRTC_LINK_FAILED' : 'NEGOTIATING_SDP_OFFER...'}
          </h2>
          <p className="text-gray-400 text-sm">
            {status === 'error' ? 'Check physical sensor connection / Webcam permissions.' : 'Awaiting ICE candidates from hardware node.'}
          </p>
        </div>
      )}
      
      {status === 'connected' && (
        <>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center space-x-2 bg-rose-500/20 px-3 py-1 rounded border border-rose-500/50">
            <div className="w-2 h-2 rounded-full bg-rose-500 blinking-dot"></div>
            <span className="text-rose-500 text-xs font-bold tracking-widest">LIVE_FEED</span>
          </div>

          <div className="absolute top-4 right-4 z-20">
            <div className="text-[9px] text-cyan-400 font-mono flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-900/80 px-2 py-1 rounded backdrop-blur-md mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              WORKERS_AI_VISION: MOONDREAM-3.1 ACTIVE
            </div>
            <button
              onClick={handleScan}
              className="w-full bg-cyan-900/50 hover:bg-cyan-800/80 text-cyan-400 border border-cyan-700/50 px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-colors"
            >
              RUN EDGE AI SCAN
            </button>
          </div>
        </>
      )}
    </div>
  );
}