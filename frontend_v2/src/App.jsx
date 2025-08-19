// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import AskQuestionPage from './components/AskQuestionPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AskQuestionPage />} />
        <Route path="*" element={<AskQuestionPage />} />
      </Routes>
    </Router>
  );
}
