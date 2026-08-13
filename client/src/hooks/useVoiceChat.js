import { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function useVoiceChat(socket, roomCode, currentUserId) {
  const [isAudioConnected, setIsAudioConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakingPlayers, setSpeakingPlayers] = useState({});

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // socketId -> RTCPeerConnection
  const remoteAudioElementsRef = useRef({}); // socketId -> HTMLAudioElement
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const speakingIntervalRef = useRef(null);

  // Helper: Create or get audio element for remote stream playback
  const playRemoteStream = (remoteSocketId, stream) => {
    let audio = remoteAudioElementsRef.current[remoteSocketId];
    if (!audio) {
      audio = document.createElement('audio');
      audio.autoplay = true;
      audio.playsInline = true;
      audio.style.display = 'none';
      document.body.appendChild(audio);
      remoteAudioElementsRef.current[remoteSocketId] = audio;
    }
    audio.srcObject = stream;
    audio.play().catch((err) => {
      console.warn('[WebRTC] Auto-play prevented for remote peer:', remoteSocketId, err);
    });
  };

  // Helper: Create RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback((remoteSocketId) => {
    if (peerConnectionsRef.current[remoteSocketId]) {
      return peerConnectionsRef.current[remoteSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[remoteSocketId] = pc;

    // Add local audio tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_candidate', {
          targetSocketId: remoteSocketId,
          candidate: event.candidate,
          senderUserId: currentUserId,
        });
      }
    };

    // Remote Track Handler -> Play audio through speakers!
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        playRemoteStream(remoteSocketId, event.streams[0]);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        const audio = remoteAudioElementsRef.current[remoteSocketId];
        if (audio) {
          audio.pause();
          audio.remove();
          delete remoteAudioElementsRef.current[remoteSocketId];
        }
      }
    };

    return pc;
  }, [socket, currentUserId]);

  // Connect Audio Call
  const connectAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setIsAudioConnected(true);
      setIsMuted(false);

      // Announce joining audio to room
      if (socket && roomCode) {
        socket.emit('webrtc_join_audio', { roomCode, userId: currentUserId });
      }

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

  // Disconnect Audio Call
  const disconnectAudio = useCallback(() => {
    if (socket && roomCode) {
      socket.emit('webrtc_leave_audio', { roomCode, userId: currentUserId });
    }
    if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};

    Object.values(remoteAudioElementsRef.current).forEach((audio) => {
      audio.pause();
      audio.remove();
    });
    remoteAudioElementsRef.current = {};

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsAudioConnected(false);
    setIsMuted(false);
    setSpeakingPlayers({});
  }, [socket, roomCode, currentUserId]);

  // Listen to WebRTC P2P mesh signaling events
  useEffect(() => {
    if (!socket) return;

    // Remote peer joined audio call -> create offer
    const handlePeerJoined = async ({ socketId: remoteSocketId }) => {
      if (!isAudioConnected) return;
      const pc = createPeerConnection(remoteSocketId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', {
          targetSocketId: remoteSocketId,
          offer,
          senderUserId: currentUserId,
        });
      } catch (err) {
        console.error('[WebRTC] Error creating offer:', err);
      }
    };

    // Received offer from peer -> create answer
    const handleOffer = async ({ senderSocketId, offer }) => {
      const pc = createPeerConnection(senderSocketId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', {
          targetSocketId: senderSocketId,
          answer,
          senderUserId: currentUserId,
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    };

    // Received answer from peer -> set remote description
    const handleAnswer = async ({ senderSocketId, answer }) => {
      const pc = peerConnectionsRef.current[senderSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('[WebRTC] Error handling answer:', err);
        }
      }
    };

    // Received ICE candidate from peer
    const handleCandidate = async ({ senderSocketId, candidate }) => {
      const pc = peerConnectionsRef.current[senderSocketId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate:', err);
        }
      }
    };

    // Remote peer left audio call
    const handlePeerLeft = ({ socketId: remoteSocketId }) => {
      const pc = peerConnectionsRef.current[remoteSocketId];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[remoteSocketId];
      }
      const audio = remoteAudioElementsRef.current[remoteSocketId];
      if (audio) {
        audio.pause();
        audio.remove();
        delete remoteAudioElementsRef.current[remoteSocketId];
      }
    };

    const handleSpeakingChange = ({ userId, isSpeaking }) => {
      setSpeakingPlayers((prev) => ({ ...prev, [userId]: isSpeaking }));
    };

    socket.on('webrtc_peer_joined', handlePeerJoined);
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_candidate', handleCandidate);
    socket.on('webrtc_peer_left', handlePeerLeft);
    socket.on('player_speaking_changed', handleSpeakingChange);

    return () => {
      socket.off('webrtc_peer_joined', handlePeerJoined);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_candidate', handleCandidate);
      socket.off('webrtc_peer_left', handlePeerLeft);
      socket.off('player_speaking_changed', handleSpeakingChange);
    };
  }, [socket, currentUserId, isAudioConnected, createPeerConnection]);

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
