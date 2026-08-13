import { useState, useEffect, useRef, useCallback } from 'react';

export default function useVoiceChat(socket, roomCode, currentUserId) {
  const [isAudioConnected, setIsAudioConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakingPlayers, setSpeakingPlayers] = useState({});

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // socketId -> RTCPeerConnection
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const speakingIntervalRef = useRef(null);

  // Initialize WebRTC P2P Audio Stream
  const connectAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setIsAudioConnected(true);
      setIsMuted(false);

      // Speaking level detection via AudioContext AnalyserNode
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let wasSpeaking = false;

        speakingIntervalRef.current = setInterval(() => {
          if (!analyserRef.current || !socket || !currentUserId) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const isSpeaking = average > 25 && !isMuted;

          if (isSpeaking !== wasSpeaking) {
            wasSpeaking = isSpeaking;
            setSpeakingPlayers((prev) => ({ ...prev, [currentUserId]: isSpeaking }));
            socket.emit('webrtc_speaking_status', {
              roomCode,
              userId: currentUserId,
              isSpeaking,
            });
          }
        }, 200);
      } catch (err) {
        console.warn('[WebRTC] AudioContext speaking detection unavailable:', err);
      }
    } catch (err) {
      console.error('[WebRTC] Microphone permission denied or unavailable:', err);
      alert('No se pudo acceder al micrófono. Por favor, otorga permisos de audio en tu navegador.');
    }
  }, [socket, roomCode, currentUserId, isMuted]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextMuteState = !isMuted;
        audioTracks[0].enabled = !nextMuteState;
        setIsMuted(nextMuteState);

        if (socket && currentUserId && roomCode) {
          socket.emit('webrtc_speaking_status', {
            roomCode,
            userId: currentUserId,
            isSpeaking: false,
          });
        }
      }
    }
  }, [isMuted, socket, currentUserId, roomCode]);

  // Disconnect Audio
  const disconnectAudio = useCallback(() => {
    if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsAudioConnected(false);
    setIsMuted(false);
    setSpeakingPlayers({});
  }, []);

  // Listen to remote speaking status socket events
  useEffect(() => {
    if (!socket) return;

    const handleSpeakingChange = ({ userId, isSpeaking }) => {
      setSpeakingPlayers((prev) => ({ ...prev, [userId]: isSpeaking }));
    };

    socket.on('player_speaking_changed', handleSpeakingChange);

    return () => {
      socket.off('player_speaking_changed', handleSpeakingChange);
    };
  }, [socket]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnectAudio();
    };
  }, [disconnectAudio]);

  return {
    isAudioConnected,
    isMuted,
    speakingPlayers,
    connectAudio,
    toggleMute,
    disconnectAudio,
  };
}
