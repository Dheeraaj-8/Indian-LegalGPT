// src/components/UploadDocument.jsx
import React, { useRef } from 'react';

const UploadDocument = ({ onDocumentSubmit, children }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      onDocumentSubmit(data.response);

    } catch (error) {
      console.error('❌ Upload failed:', error);
      // Optionally notify the user of the failure
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {children({ triggerFilePicker })}
      <input
        type="file"
        accept=".txt,.pdf,.doc,.docx"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button className="upload-btn"><i className="fa fa-cloud-upload-alt"></i></button>
    </>
  );
};

export default UploadDocument;
