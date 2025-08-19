import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function sendChatMessage(query) {
  const res = await axios.post(`${API_URL}/ask`, { query });
  return res.data.response;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${API_URL}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data.response;
}

export async function sendVoice(audioFile) {
  const formData = new FormData();
  formData.append('file', audioFile);
  const res = await axios.post(`${API_URL}/voice`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function speechToText(audioFile, language = 'en-IN') {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  const res = await axios.post(`${API_URL}/speech-to-text?language=${language}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function textToSpeech(text, saveAudio = false) {
  const res = await axios.post(`${API_URL}/text-to-speech`, {
    text: text,
    save_audio: saveAudio
  });
  return res.data;
}

export async function startRecording() {
  const res = await axios.post(`${API_URL}/start-recording`);
  return res.data;
}

export async function stopRecording() {
  const res = await axios.post(`${API_URL}/stop-recording`);
  return res.data;
}

export async function getSupportedLanguages() {
  const res = await axios.get(`${API_URL}/speech-languages`);
  return res.data;
}

export async function generateDocument(description, preferredType = null) {
  const res = await axios.post(`${API_URL}/generate-document`, {
    description,
    preferred_type: preferredType
  });
  return res.data.content;
}
