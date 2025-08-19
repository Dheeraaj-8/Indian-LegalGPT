// src/components/VoiceRecorder.jsx
import React, { useState, useRef } from 'react';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onTranscription, children }) => {
  const [recording, setRecording] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setStatusMessage('Listening...');
      setStatusType('loading');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setStatusMessage('Transcribing...');
        setStatusType('loading');
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice_input.webm');

        try {
          const response = await fetch('http://localhost:8000/voice', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          
          if (data.success) {
            setStatusMessage('Transcription complete!');
            setStatusType('success');
            // Use the correct field name from backend
            const transcriptionText = data.transcribed_text || data.legal_response || 'Transcription completed';
            onTranscription(transcriptionText);
          } else {
            setStatusMessage(data.error || 'Failed to transcribe voice');
            setStatusType('error');
          }
          
          // Clear status after 2 seconds
          setTimeout(() => {
            setStatusMessage('');
            setStatusType('');
          }, 2000);
        } catch (error) {
          console.error('❌ Voice transcription failed:', error);
          setStatusMessage('Failed to transcribe voice');
          setStatusType('error');
        }
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied or not available.', err);
      setStatusMessage('Microphone access denied');
      setStatusType('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setRecording(false);
  };

  const getStatusIcon = () => {
    switch (statusType) {
      case 'success':
        return <i className="fas fa-check-circle"></i>;
      case 'error':
        return <i className="fas fa-exclamation-circle"></i>;
      case 'loading':
        return <i className="fas fa-spinner fa-spin"></i>;
      default:
        return null;
    }
  };

  const RecordingWave = () => (
    <div className="recording-wave">
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
    </div>
  );

  return children({ startRecording, stopRecording, recording });
};

export default VoiceRecorder;
