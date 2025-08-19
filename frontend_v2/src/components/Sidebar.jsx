// src/components/Sidebar.jsx
import React from 'react';
import './Sidebar.css';
import ThemeToggle from './ThemeToggle';
import { FaPlus } from 'react-icons/fa';

const Sidebar = ({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat, showOnlyNewChat }) => {
  return (
    <div className="sidebar slide-in">
      <div className="sidebar-header">
        <h2>Legal Assistant</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="new-chat-btn" onClick={onNewChat} title="New Chat">
            <FaPlus size={18} />
          </button>
          <ThemeToggle />
        </div>
      </div>
      {!showOnlyNewChat && (
        <div className="chat-list">
          {chats.length === 0 && <div className="chat-list-empty">No chats yet.</div>}
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-list-item${chat.id === activeChatId ? ' active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
              tabIndex={0}
              role="button"
              onKeyPress={e => { if (e.key === 'Enter') onSelectChat(chat.id); }}
            >
              <span className="chat-list-title">{chat.title || (chat.messages[0]?.content?.slice(0, 20) || 'New Chat')}</span>
              <button className="chat-list-delete" title="Delete Chat" onClick={e => { e.stopPropagation(); onDeleteChat(chat.id); }}>×</button>
            </div>
          ))}
        </div>
      )}
      <div className="sidebar-footer">
        <p>All chats are saved locally.</p>
      </div>
    </div>
  );
};

export default Sidebar;
