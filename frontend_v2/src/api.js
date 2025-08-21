import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

console.log('API URL:', API_URL);

export async function sendChatMessage(query) {
  console.log('Sending chat message to:', `${API_URL}/ask`);
  try {
    const res = await axios.post(`${API_URL}/ask`, { query });
    console.log('Chat response:', res.data);
    return res.data.response;
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}

export async function uploadDocument(file) {
  console.log('Uploading document to:', `${API_URL}/upload`);
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log('Upload response:', res.data);
    return res.data.response;
  } catch (error) {
    console.error('Upload API error:', error);
    throw error;
  }
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
