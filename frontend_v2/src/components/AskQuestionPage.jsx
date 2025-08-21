import React, { useRef } from 'react';
import Sidebar from './Sidebar';
import { FaCloudUploadAlt, FaMicrophone, FaRegFileAlt, FaLightbulb, FaSearch, FaPaperPlane, FaDownload, FaChevronDown } from 'react-icons/fa';
import './AskQuestionPage.css';
import { sendChatMessage, uploadDocument, textToSpeech, startRecording, stopRecording, generateDocument } from '../api';
import { v4 as uuidv4 } from 'uuid';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DOC_TYPE_OPTIONS = [
  '',
  'Legal notice',
  'Affidavit',
  'Consumer complaint',
  'RTI application',
  'Property document',
  'Lease/Rent agreement',
  'Mortgage deed',
  'Termination notice',
  'Cheque bounce complaint (S.138 NI Act)',
  'Writ petition',
  'Anticipatory bail application',
  'Other'
];

export default function AskQuestionPage() {
  const uploadRef = useRef();
  const [input, setInput] = React.useState('');
  const [recording, setRecording] = React.useState(false);
  const [chats, setChats] = React.useState(() => {
    const saved = localStorage.getItem('chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeChatId, setActiveChatId] = React.useState(() => {
    const saved = localStorage.getItem('activeChatId');
    return saved || null;
  });
  const [showFeatures, setShowFeatures] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState('idle');
  const [uploadedFileName, setUploadedFileName] = React.useState('');
  const chatEndRef = useRef(null);
  const [showHindiKeyboard, setShowHindiKeyboard] = React.useState(false);
  const inputRef = useRef();

  // Document Generator mode
  const [docGenMode, setDocGenMode] = React.useState(false);
  const [docType, setDocType] = React.useState('');
  const [showDocMenu, setShowDocMenu] = React.useState(false);

  // Define features inside component to access state
  const features = [
    {
      icon: <FaRegFileAlt size={36} color="#6366f1" />, title: 'Document Analysis', desc: 'Upload legal documents and get simplified explanations',
      onClick: () => {
        // Ensure we have an active chat before uploading
        if (!activeChatId) {
          handleNewChat();
          // Wait for chat to be created, then trigger upload
          setTimeout(() => uploadRef.current && uploadRef.current.click(), 100);
        } else {
          uploadRef.current && uploadRef.current.click();
        }
      }
    },
    {
      icon: <FaMicrophone size={36} color="#6366f1" />, title: 'Voice Queries', desc: 'Speak your questions in Hindi or English',
      onClick: () => startVoice()
    },
    {
      icon: <FaLightbulb size={36} color="#6366f1" />, title: 'Legal Guidance', desc: 'Get preliminary advice and next steps',
      onClick: () => {
        if (!activeChatId) {
          handleNewChat();
          setTimeout(() => setInput('What is the procedure for filing a consumer complaint?'), 100);
        } else {
          setInput('What is the procedure for filing a consumer complaint?');
        }
      }
    },
    {
      icon: <FaSearch size={36} color="#6366f1" />, title: 'Case Analysis', desc: 'Understand if your case is worth pursuing',
      onClick: () => {
        if (!activeChatId) {
          handleNewChat();
          setTimeout(() => setInput('Is my case strong enough to take to court?'), 100);
        } else {
          setInput('Is my case strong enough to take to court?');
        }
      }
    },
  ];

  React.useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);
  React.useEffect(() => {
    if (activeChatId) localStorage.setItem('activeChatId', activeChatId);
  }, [activeChatId]);

  const getActiveChat = () => chats.find(c => c.id === activeChatId);

  const startVoice = async () => {
    try {
      setRecording(true);
      const result = await startRecording();
      if (!result.success) setRecording(false);
    } catch {
      setRecording(false);
    }
  };
  
  const stopVoice = async () => {
    try {
      setRecording(false);
      const result = await stopRecording();
      if (result.success && result.transcription && result.transcription.success) {
        const transcribedText = result.transcription.transcription;
        setInput(transcribedText);
      }
    } catch {}
  };

  const appendMessage = (role, content) => {
    if (!activeChatId) return; // Don't append if no active chat
    
    setChats(prev => prev.map(chat =>
      chat.id === activeChatId
        ? { ...chat, messages: [...chat.messages, { role, content }] }
        : chat
    ));
  };

  const handleSend = async () => {
    console.log('Send triggered with input:', input);
    if (input.trim()) {
      // Create new chat if none exists
      if (!activeChatId) {
        console.log('No active chat, creating new one...');
        handleNewChat();
        // Wait a bit for the chat to be created
        setTimeout(() => handleSend(), 100);
        return;
      }
      
      console.log('Sending message for chat:', activeChatId);
      appendMessage('user', input);
      const pendingInput = input;
      setInput('');
      setShowFeatures(false);
      setIsLoading(true);
      try {
        let aiResponse;
        if (docGenMode) {
          console.log('Generating document...');
          aiResponse = await generateDocument(pendingInput, docType || null);
        } else {
          console.log('Sending chat message...');
          aiResponse = await sendChatMessage(pendingInput);
        }
        console.log('AI response received:', aiResponse);
        appendMessage('assistant', aiResponse);
        
        // Update chat title if it's still "New Chat"
        const activeChat = getActiveChat();
        if (activeChat && activeChat.title === 'New Chat') {
          const newTitle = generateChatTitle(pendingInput);
          updateChatTitle(activeChatId, newTitle);
        }
        
        try { await textToSpeech(aiResponse); } catch {}
      } catch (error) {
        console.error('Error sending message:', error);
        appendMessage('assistant', '❌ Error contacting server. Please check if the backend is running.');
      }
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    console.log('Creating new chat...');
    const newId = uuidv4();
    const newChat = { id: newId, title: 'New Chat', messages: [], createdAt: Date.now() };
    console.log('New chat created with ID:', newId);
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
    setInput('');
    setShowFeatures(true);
    console.log('New chat activated, showFeatures set to true');
  };

  const generateChatTitle = (content) => {
    if (!content) return 'New Chat';
    
    // Extract first few words for title
    const words = content.trim().split(/\s+/);
    if (words.length <= 3) return content.trim();
    
    // For longer content, take first 3-4 words
    const title = words.slice(0, 4).join(' ');
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  };

  const updateChatTitle = (chatId, newTitle) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    ));
  };

  const handleSelectChat = (id) => { setActiveChatId(id); setShowFeatures(false); };

  const handleDeleteChat = (id) => {
    setChats(prev => prev.filter(chat => chat.id !== id));
    if (activeChatId === id) {
      const remaining = chats.filter(chat => chat.id !== id);
      setActiveChatId(remaining[0]?.id || null);
      setShowFeatures(true);
    }
  };

  const handleFileChange = async (e) => {
    console.log('File change triggered:', e.target.files[0]);
    if (e.target.files.length > 0) {
      // Create new chat if none exists
      if (!activeChatId) {
        console.log('No active chat, creating new one...');
        handleNewChat();
        // Wait for chat to be created, then trigger upload
        setTimeout(() => handleFileChange(e), 100);
        return;
      }
      
      console.log('Processing file upload for chat:', activeChatId);
      setUploadStatus('uploading');
      setUploadedFileName(e.target.files[0].name);
      setIsLoading(true);
      try {
        const result = await uploadDocument(e.target.files[0]);
        console.log('Upload successful:', result);
        setUploadStatus('success');
        setShowFeatures(false); // Hide feature cards after successful upload
        
        // Update chat title with document name
        const docName = e.target.files[0].name.replace(/\.[^/.]+$/, ""); // Remove file extension
        updateChatTitle(activeChatId, docName);
        
        // Don't add upload message to chat - just show the status display
        // appendMessage('assistant', 'Document uploaded and indexed.');
        
        // Clear upload status after 5 seconds so user can see the success message
        setTimeout(() => {
          setUploadStatus('idle');
        }, 5000);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadStatus('error');
        appendMessage('assistant', '❌ Error uploading document. Please check if the backend is running.');
      }
      setIsLoading(false);
    }
  };

  const handleHindiKeyPress = (button) => {
    const inputElem = inputRef.current; if (!inputElem) return;
    const start = inputElem.selectionStart; const end = inputElem.selectionEnd;
    const newValue = input.slice(0, start) + button + input.slice(end);
    setInput(newValue);
    setTimeout(() => { inputElem.focus(); inputElem.setSelectionRange(start + button.length, start + button.length); }, 0);
  };

  const handleHindiBackspace = () => {
    const inputElem = inputRef.current; if (!inputElem) return;
    const start = inputElem.selectionStart; const end = inputElem.selectionEnd; if (start === 0 && end === 0) return;
    let newValue; let newPos;
    if (start === end) { if (start === 0) return; newValue = input.slice(0, start - 1) + input.slice(end); newPos = start - 1; }
    else { newValue = input.slice(0, start) + input.slice(end); newPos = start; }
    setInput(newValue);
    setTimeout(() => { inputElem.focus(); inputElem.setSelectionRange(newPos, newPos); }, 0);
  };

  React.useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [chats, activeChatId]);

  const activeChat = getActiveChat();

  return (
    <div className="aqp-flex-root">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        showOnlyNewChat={false}
      />
      <main className="aqp-flex-main">
        <div className="aqp-grid-bg">
          <div className="aqp-welcome-section">
            <div className="aqp-welcome-emoji">⚖️</div>
            <h1 className="aqp-welcome-title">Welcome to AI Legal Assistant</h1>
            {showFeatures && (
              <p className="aqp-welcome-desc">Your intelligent legal companion for understanding legal documents, getting preliminary guidance, and navigating the Indian legal system. Ask questions in Hindi or English!</p>
            )}
          </div>
          <div className={`aqp-features-row${(!activeChat || showFeatures) ? ' fade-in' : ' fade-out'}`} style={{ pointerEvents: (!activeChat || showFeatures) ? 'auto' : 'none', opacity: (!activeChat || showFeatures) ? 1 : 0 }}>
            {(!activeChat || showFeatures) && features.map((f) => (
              <div className="aqp-feature-card aqp-feature-clickable" key={f.title} onClick={() => f.onClick()} tabIndex={0} role="button" onKeyDown={e => { if (e.key === 'Enter') f.onClick(); }}>
                <div className="aqp-feature-icon">{f.icon}</div>
                <div className="aqp-feature-title">{f.title}</div>
                <div className="aqp-feature-desc">{f.desc}</div>
              </div>
            ))}
            <input type="file" ref={uploadRef} style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
          
          {(!showFeatures && activeChat) && (
            <div className="aqp-chat-messages-area">
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <button 
                  onClick={() => setShowFeatures(true)} 
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Show Features
                </button>
              </div>
              {activeChat.messages.map((msg, idx) => (
                <div key={idx} className={`aqp-chat-bubble ${msg.role}`}>
                  {msg.role === 'assistant' ? (
                    <div className="md-doc">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="aqp-chat-bubble assistant">
                  <span className="typing-indicator"><span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
          <div className="aqp-chat-section">
            {/* Document Title Display */}
            {activeChat && activeChat.title !== 'New Chat' && (
              <div className="aqp-document-title">
                {activeChat.title}
              </div>
            )}
            {uploadStatus === 'success' && !activeChat && (
              <div className="aqp-document-title">
                {uploadedFileName.replace(/\.[^/.]+$/, "")}
              </div>
            )}
            
            {/* Upload Status Display - Above Chat Input */}
            {uploadStatus === 'uploading' && (
              <div className="aqp-upload-status-compact uploading">
                <div className="aqp-upload-icon-compact">📄</div>
                <div className="aqp-upload-text-compact">
                  <div className="aqp-upload-title-compact">Uploading...</div>
                  <div className="aqp-upload-filename-compact">{uploadedFileName}</div>
                </div>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="aqp-upload-status-compact success">
                <div className="aqp-upload-icon-compact">✅</div>
                <div className="aqp-upload-text-compact">
                  <div className="aqp-upload-title-compact">Upload Successful!</div>
                  <div className="aqp-upload-filename-compact">{uploadedFileName}</div>
                </div>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div className="aqp-upload-status-compact error">
                <div className="aqp-upload-icon-compact">❌</div>
                <div className="aqp-upload-text-compact">
                  <div className="aqp-upload-title-compact">Upload Failed</div>
                  <div className="aqp-upload-filename-compact">{uploadedFileName}</div>
                </div>
              </div>
            )}
            
            <div className="aqp-chat-input-bar">
              <div className="aqp-chat-label-left">Chat</div>
              <button className="aqp-chat-btn" title="Upload" onClick={() => {
                if (!activeChatId) {
                  handleNewChat();
                  setTimeout(() => uploadRef.current && uploadRef.current.click(), 100);
                } else {
                  uploadRef.current && uploadRef.current.click();
                }
              }}><FaCloudUploadAlt size={20} /></button>
              <button className={`aqp-chat-btn${recording ? ' recording' : ''}`} title="Voice" onClick={recording ? stopVoice : startVoice} style={{ backgroundColor: recording ? '#ef4444' : 'transparent', color: recording ? 'white' : 'inherit' }}><FaMicrophone size={20} /></button>
              <button className="aqp-chat-btn" title="Hindi Keyboard" onClick={() => setShowHindiKeyboard(v => !v)} style={{ fontSize: 18 }}>अ</button>
              {/* Compact Document Generator controls */}
              <div className={`docgen-pill ${docGenMode ? 'active' : ''}`}>
                <button className="docgen-toggle" title={docGenMode ? 'Document Generator: ON' : 'Document Generator: OFF'} onClick={() => setDocGenMode(v => !v)}>
                  <FaRegFileAlt size={16} />
                  <span className="docgen-label">Doc Gen</span>
                </button>
                <button className="docgen-type" title="Document Type" onClick={() => setShowDocMenu(v => !v)}>
                  <span className="docgen-type-text">{docType || 'Auto'}</span>
                  <FaChevronDown size={12} />
                </button>
                {showDocMenu && (
                  <div className="docgen-menu">
                    {DOC_TYPE_OPTIONS.map(opt => (
                      <div
                        key={opt || 'auto'}
                        className={`docgen-menu-item ${docType === opt ? 'selected' : ''}`}
                        onClick={() => { setDocType(opt); setShowDocMenu(false); }}
                        title={opt || 'Auto'}
                      >
                        {opt || 'Auto'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input className="aqp-chat-input" placeholder={docGenMode ? "Describe your case..." : "Ask your legal question..."} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} ref={inputRef} />
              <button className="aqp-chat-btn" title="Export" onClick={() => {
                const chat = getActiveChat();
                if (!chat) return;
                const last = [...chat.messages].reverse().find(m => m.role === 'assistant');
                if (!last) return;
                const blob = new Blob([last.content], { type: 'text/markdown;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'legal_document.md';
                a.click();
                URL.revokeObjectURL(url);
              }}><FaDownload size={20} /></button>
              <button className="aqp-chat-btn aqp-send-btn" title="Send" onClick={handleSend}><FaPaperPlane size={20} /></button>
            </div>
            {showHindiKeyboard && (
              <div className="hindi-keyboard-outer" style={{ position: 'relative', width: 'fit-content', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <button className="hindi-keyboard-close" style={{ background: '#fff', border: '1px solid #eee', borderRadius: '50%', fontSize: 22, width: 32, height: 32, cursor: 'pointer', boxShadow: '0 1px 4px #0001' }} onClick={() => setShowHindiKeyboard(false)} title="Close Keyboard">×</button>
                </div>
                <div className="hindi-keyboard-container">
                  <Keyboard layout={{ default: ['ऄ अ आ इ ई उ ऊ ए ऐ ओ औ','क ख ग घ ङ च छ ज झ ञ','ट ठ ड ढ ण त थ द ध न','प फ ब भ म य र ल व','श ष स ह ळ क्ष ज्ञ','BACKSPACE SPACE'] }} display={{ 'SPACE': '␣','BACKSPACE': '⌫' }} buttonTheme={[]} onKeyPress={button => { if (button === 'SPACE') handleHindiKeyPress(' '); else if (button === 'BACKSPACE') handleHindiBackspace(); else handleHindiKeyPress(button); }} theme="hg-theme-default hg-layout-default" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
