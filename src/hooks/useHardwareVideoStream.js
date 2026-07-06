import { useEffect, useRef, useState } from 'react';

/**
 * MOCK IMPLEMENTATION OF WEBRTC PIPELINE
 * For demonstration, this hook attempts to capture the user's local webcam
 * to simulate the incoming raw hardware video feed described in the blueprint.
 */
export function useHardwareVideoStream(deviceId) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    let stream = null;

    const initStream = async () => {
      try {
        setStatus('connecting');
        // Simulating the WebRTC SDP handshake delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('connected');
        }
      } catch (err) {
        console.warn('Simulated WebRTC stream failed (Webcam access denied or unavailable).', err);
        setStatus('error');
      }
    };

    initStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId]);

  return { videoRef, status };
}