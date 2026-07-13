import { useEffect, useRef, useState } from 'react';
import { aximCoreClient } from '../lib/supabaseClient';

/**
 * WEBRTC PIPELINE SCAFFOLDING
 * This hook sets up an RTCPeerConnection and uses a Supabase Realtime channel
 * for signaling (exchanging offer, answer, and ICE candidates).
 * It uses the local webcam as a fallback stream for development purposes.
 */
export function useHardwareVideoStream(deviceId) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const peerConnectionRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    let fallbackStream = null;

    const setupWebRTC = async () => {
      setStatus('connecting');

      // 1. Scaffold RTCPeerConnection
      let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
      try {
        if (import.meta.env.VITE_WEBRTC_ICE_SERVERS) {
          iceServers = JSON.parse(import.meta.env.VITE_WEBRTC_ICE_SERVERS);
        }
      } catch (e) {
        console.error("Failed to parse VITE_WEBRTC_ICE_SERVERS, falling back to default.", e);
      }

      const configuration = { iceServers };
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Handle incoming ICE candidates from hardware node
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'webrtc_candidate',
            payload: { candidate: event.candidate }
          });
        }
      };

      // Handle incoming video stream from hardware node
      peerConnection.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setStatus('connected');
        }
      };

      // 2. Set up dedicated Supabase Realtime channel for signaling
      const channel = aximCoreClient.channel(`webrtc_signaling:${deviceId}`);
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'webrtc_offer' }, async (payload) => {
          try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            channel.send({
              type: 'broadcast',
              event: 'webrtc_answer',
              payload: { answer }
            });
          } catch (err) {
            console.error('Error handling WebRTC offer:', err);
          }
        })
        .on('broadcast', { event: 'webrtc_answer' }, async (payload) => {
          try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));
          } catch (err) {
            console.error('Error handling WebRTC answer:', err);
          }
        })
        .on('broadcast', { event: 'webrtc_candidate' }, async (payload) => {
          try {
            if (payload.candidate) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to WebRTC signaling channel for ${deviceId}`);
            // To initiate the call from the dashboard, you would create an offer here,
            // but usually the hardware node initiates or vice versa depending on architecture.
            // For now, we are ready to receive an offer.
          }
        });

      // 3. Fallback Stream for Development
      try {
        // Simulating the WebRTC SDP handshake delay for the fallback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        // Only set the fallback if the WebRTC stream hasn't connected yet
        if (videoRef.current && peerConnection.connectionState !== 'connected') {
          videoRef.current.srcObject = fallbackStream;
          setStatus('connected (fallback)');
        }

        // Add fallback tracks to the peer connection so they can be sent if needed
        fallbackStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, fallbackStream);
        });

      } catch (err) {
        console.warn('Simulated WebRTC stream fallback failed (Webcam access denied or unavailable).', err);
        if (status === 'connecting') {
           setStatus('error (fallback unavailable)');
        }
      }
    };

    setupWebRTC();

    return () => {
      // 1. Explicitly stop all media tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (fallbackStream) {
        fallbackStream.getTracks().forEach(track => track.stop());
      }

      // 2. Nullify listeners and close RTCPeerConnection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // 3. Tear down signaling WebSocket channel
      if (channelRef.current) {
        aximCoreClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [deviceId]);

  return { videoRef, status };
}
