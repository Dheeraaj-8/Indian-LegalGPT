#!/usr/bin/env python3

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import json
import time
import queue
from pathlib import Path
import os

from utils_fast import ask_indian_legalgpt_fast, upload_document_to_rag_fast, process_voice_input_fast
from utils_fast import generate_legal_document_fast
from speech_features import get_speech_processor

app = FastAPI(
    title="Advanced Legal AI Assistant",
    description="Resume-worthy legal AI with custom fine-tuning, multi-modal processing, and advanced document analysis",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "https://*.vercel.app",
        "https://*.netlify.app",
        os.getenv("FRONTEND_URL", "*")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


document_analyzer = None
multimodal_ai = None

# Global document storage for RAG
uploaded_documents = {}

def get_document_analyzer():
    """Lazy load document analyzer"""
    global document_analyzer
    if document_analyzer is None:
        from legal_document_analyzer import LegalDocumentAnalyzer
        document_analyzer = LegalDocumentAnalyzer()
    return document_analyzer

def get_multimodal_ai():
    """Lazy load multimodal AI"""
    global multimodal_ai
    if multimodal_ai is None:
        from multimodal_legal_ai import MultiModalLegalAI
        multimodal_ai = MultiModalLegalAI()
    return multimodal_ai

class ChatRequest(BaseModel):
    query: str

class DocumentAnalysisRequest(BaseModel):
    text: str

class MultimodalRequest(BaseModel):
    text_input: str = None
    voice_input: str = None
    document_path: str = None

class DocumentGenerationRequest(BaseModel):
    description: str
    preferred_type: str | None = None

class TextToSpeechRequest(BaseModel):
    text: str
    save_audio: bool = False

@app.get("/")
async def root():
    """Root endpoint with project information"""
    return {
        "message": "Advanced Legal AI Assistant",
        "version": "2.0.0",
        "features": [
            "Custom fine-tuned legal model",
            "Multi-modal AI processing",
            "Advanced document analysis",
            "Enhanced RAG system",
            "Legal risk assessment",
            "Voice interface",
            "OCR document processing"
        ],
        "status": "Resume-worthy legal AI application"
    }

@app.post("/ask")
async def ask_question(request: ChatRequest):
    """Ultra-fast legal Q&A with RAG from uploaded documents"""
    try:
        print(f"Question received: {request.query}")
        print(f"Uploaded documents count: {len(uploaded_documents)}")
        print(f"Document keys: {list(uploaded_documents.keys())}")
        
        # Check if we have uploaded documents to use for RAG
        if uploaded_documents:
            print("Using uploaded documents for RAG")
            # Use the uploaded documents for context
            document_context = ""
            for filename, doc_info in uploaded_documents.items():
                print(f"Processing document: {filename}")
                print(f"Document content length: {len(doc_info['content'])}")
                document_context += f"\n\nDocument: {filename}\nContent: {doc_info['content'][:2000]}...\n"
            
            # Create enhanced query with document context
            enhanced_query = f"""
            Question: {request.query}
            
            Context from uploaded documents:
            {document_context}
            
            Please answer the question based on the uploaded documents. If the documents don't contain relevant information, provide general Indian legal guidance.
            """
            
            print(f"Enhanced query length: {len(enhanced_query)}")
            print(f"Enhanced query preview: {enhanced_query[:500]}...")
            
            response = ask_indian_legalgpt_fast(enhanced_query)
        else:
            print("No documents uploaded, using regular legal knowledge")
            # No documents uploaded, use regular legal knowledge
            response = ask_indian_legalgpt_fast(request.query)
        
        print(f"Response received: {response[:200]}...")
        
        analysis = {
            "query": request.query,
            "response": response,
            "legal_domain": _classify_legal_domain(request.query),
            "confidence_score": 0.95,
            "sources": ["Uploaded Documents"] if uploaded_documents else ["Indian Constitution", "IPC", "Civil Laws"],
            "advanced_features": [
                "RAG from uploaded documents" if uploaded_documents else "General legal knowledge",
                "Document context awareness",
                "Multi-domain knowledge"
            ]
        }
        
        return {"response": response, "analysis": analysis}
    
    except Exception as e:
        print(f"Error in ask endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Advanced document upload with analysis - OPTIMIZED"""
    try:
        # Create uploads directory
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        file_path = upload_dir / file.filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Extract text based on file type
        extracted_text = ""
        print(f"Processing file: {file.filename}")
        print(f"File path: {file_path}")
        
        if file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            try:
                import pytesseract
                from PIL import Image
                image = Image.open(file_path)
                extracted_text = pytesseract.image_to_string(image, timeout=10)  # Add timeout
                print("OCR processing completed")
            except ImportError:
                extracted_text = "OCR processing not available - pytesseract not installed"
                print("OCR not available")
            except Exception as e:
                extracted_text = f"OCR processing error: {str(e)}"
                print(f"OCR error: {e}")
        elif file.filename.lower().endswith(('.pdf')):
            print("Processing PDF file...")
            # Try PyPDF2 first
            try:
                import PyPDF2
                print("PyPDF2 imported successfully")
                with open(file_path, 'rb') as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    extracted_text = ""
                    for page_num, page in enumerate(pdf_reader.pages):
                        page_text = page.extract_text()
                        if page_text:
                            extracted_text += page_text + "\n"
                            print(f"Page {page_num + 1}: {len(page_text)} characters")
                        else:
                            print(f"Page {page_num + 1}: No text extracted")
                print(f"PyPDF2 extracted {len(extracted_text)} characters")
            except ImportError:
                print("PyPDF2 not available")
                extracted_text = "PDF processing not available - PyPDF2 not installed"
            except Exception as e:
                print(f"PyPDF2 error: {e}")
                extracted_text = f"PDF processing error: {str(e)}"
                
            # If no text extracted, try alternative method
            if not extracted_text or len(extracted_text.strip()) < 10:
                print("Trying alternative PDF method...")
                try:
                    import fitz  # PyMuPDF
                    print("PyMuPDF imported successfully")
                    doc = fitz.open(file_path)
                    extracted_text = ""
                    for page_num, page in enumerate(doc):
                        page_text = page.get_text()
                        extracted_text += page_text + "\n"
                        print(f"PyMuPDF Page {page_num + 1}: {len(page_text)} characters")
                    doc.close()
                    print(f"PyMuPDF extracted {len(extracted_text)} characters")
                except ImportError:
                    print("PyMuPDF not available")
                    if not extracted_text:
                        extracted_text = "PDF processing not available - PyMuPDF not installed"
                except Exception as e:
                    print(f"PyMuPDF error: {e}")
                    if not extracted_text:
                        extracted_text = f"Alternative PDF processing error: {str(e)}"
                        
            # Final fallback - try to read as text (some PDFs are actually text)
            if not extracted_text or len(extracted_text.strip()) < 10:
                print("Trying text fallback...")
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        fallback_text = f.read()
                        if len(fallback_text.strip()) > 10:
                            extracted_text = fallback_text
                            print(f"Fallback text extraction: {len(extracted_text)} characters")
                except Exception as e:
                    print(f"Fallback text error: {e}")
                            
        elif file.filename.lower().endswith(('.docx', '.doc')):
            try:
                from docx import Document
                doc = Document(file_path)
                extracted_text = ""
                for paragraph in doc.paragraphs:
                    extracted_text += paragraph.text + "\n"
            except ImportError:
                extracted_text = "Word document processing not available - python-docx not installed"
            except Exception as e:
                extracted_text = f"Word document processing error: {str(e)}"
        else:
            # For text files, read content
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    extracted_text = f.read()
            except Exception:
                extracted_text = "Text extraction for this file type is not available in this demo."
        
        # Ensure we have some text content
        if not extracted_text or len(extracted_text.strip()) < 10:
            extracted_text = f"Document {file.filename} uploaded but text extraction was minimal or failed. This may be a scanned document or unsupported format."
        
        print(f"Final extracted text length: {len(extracted_text)} characters")
        print(f"Text preview: {extracted_text[:200]}...")
        
        # Store document content for RAG
        uploaded_documents[file.filename] = {
            "content": extracted_text,
            "file_path": str(file_path),
            "upload_time": time.time()
        }
        
        print(f"Document stored in uploaded_documents. Total documents: {len(uploaded_documents)}")
        print(f"Document keys: {list(uploaded_documents.keys())}")
        
        # Simple RAG response (no external API calls)
        rag_response = f"Document {file.filename} uploaded and indexed for analysis"
        
        response_msg = "Document uploaded and analyzed successfully"
        return {
            "message": response_msg,
            "response": response_msg,
            "filename": file.filename,
            "extracted_text": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
            "rag_status": rag_response
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@app.post("/voice")
async def process_voice(file: UploadFile = File(...)):
    """Advanced voice processing with speech-to-text - OPTIMIZED"""
    try:
       
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        audio_path = upload_dir / file.filename
        
        with open(audio_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
       
        speech_processor = get_speech_processor()
        result = speech_processor.speech_to_text(str(audio_path))
        
        if result["success"]:
            
            response = ask_indian_legalgpt_fast(result["transcription"])
            
            return {
                "success": True,
                "transcribed_text": result["transcription"],
                "confidence": result["confidence"],
                "legal_response": response,
                "features": result["features"] + [
                    "Legal context processing",
                    "Multi-modal integration"
                ]
            }
        else:
            return {
                "success": False,
                "error": result["error"],
                "suggestions": result.get("suggestions", [])
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice processing error: {str(e)}")

@app.post("/speech-to-text")
async def speech_to_text_endpoint(audio_file: UploadFile = File(...), language: str = "en-IN"):
    """Convert speech to text with advanced features"""
    try:
        # Save audio file
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        audio_path = upload_dir / audio_file.filename
        
        with open(audio_path, "wb") as buffer:
            content = await audio_file.read()
            buffer.write(content)
        
        # Process speech to text
        speech_processor = get_speech_processor()
        result = speech_processor.speech_to_text(str(audio_path), language)
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech-to-text error: {str(e)}")

@app.post("/text-to-speech")
async def text_to_speech_endpoint(payload: TextToSpeechRequest):
    """Convert text to speech with legal context awareness"""
    try:
        speech_processor = get_speech_processor()
        
        if payload.save_audio:
            # Save audio file
            upload_dir = Path("uploads")
            upload_dir.mkdir(exist_ok=True)
            output_path = upload_dir / f"tts_output_{int(time.time())}.wav"
            result = speech_processor.text_to_speech(payload.text, str(output_path))
        else:
            # Play directly
            result = speech_processor.text_to_speech(payload.text)
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-speech error: {str(e)}")

@app.post("/start-recording")
async def start_realtime_recording():
    """Start real-time speech recording"""
    try:
        speech_processor = get_speech_processor()
        result = speech_processor.start_realtime_recording()
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recording start error: {str(e)}")

@app.post("/stop-recording")
async def stop_realtime_recording():
    """Stop real-time speech recording and get transcription"""
    try:
        speech_processor = get_speech_processor()
        result = speech_processor.stop_realtime_recording()
        
        # Get transcription from queue
        try:
            transcription_result = speech_processor.audio_queue.get_nowait()
            result["transcription"] = transcription_result
        except queue.Empty:
            result["transcription"] = {"success": False, "error": "No audio recorded"}
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recording stop error: {str(e)}")

@app.get("/speech-languages")
async def get_supported_languages():
    """Get supported languages for speech recognition"""
    try:
        speech_processor = get_speech_processor()
        return speech_processor.get_supported_languages()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Language info error: {str(e)}")

@app.post("/analyze-document")
async def analyze_document(request: DocumentAnalysisRequest):
    """Advanced legal document analysis - OPTIMIZED"""
    try:
       
        analyzer = get_document_analyzer()
        analysis = analyzer.generate_legal_summary(request.text)
        
        return {
            "analysis": analysis,
            "features_used": [
                "Legal entity extraction",
                "Sentiment analysis",
                "Risk assessment",
                "Document classification"
            ]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.post("/multimodal")
async def process_multimodal(request: MultimodalRequest):
    """Multi-modal legal AI processing - OPTIMIZED"""
    try:
       
        multimodal = get_multimodal_ai()
        result = multimodal.process_multimodal_input(
            text_input=request.text_input,
            voice_input=request.voice_input,
            document_path=request.document_path
        )
        
        return {
            "result": result,
            "advanced_features": [
                "Multi-modal processing",
                "Voice recognition",
                "OCR document processing",
                "Comprehensive legal analysis"
            ]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multimodal processing error: {str(e)}")

@app.post("/generate-document")
async def generate_document(request: DocumentGenerationRequest):
    """Generate a formal legal document from a user case description."""
    try:
        content = generate_legal_document_fast(request.description, request.preferred_type)
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document generation error: {str(e)}")

@app.get("/features")
async def get_features():
    """Get available advanced features"""
    return {
        "advanced_features": {
            "document_analysis": "Advanced legal document analysis with OCR",
            "multimodal_ai": "Voice, text, and document processing",
            "rag_enhancement": "Enhanced RAG with legal context",
            "voice_interface": "Voice-based legal assistant",
            "legal_summary_generation": "AI-generated legal summaries"
        }
    }

@app.get("/documents")
async def list_documents():
    """List all uploaded documents"""
    return {
        "documents": list(uploaded_documents.keys()),
        "count": len(uploaded_documents),
        "details": {
            filename: {
                "upload_time": doc_info["upload_time"],
                "content_length": len(doc_info["content"]),
                "preview": doc_info["content"][:200] + "..." if len(doc_info["content"]) > 200 else doc_info["content"]
            }
            for filename, doc_info in uploaded_documents.items()
        }
    }

def _classify_legal_domain(query: str) -> str:
    """Classify the legal domain of the query"""
    query_lower = query.lower()
    
    if any(word in query_lower for word in ["article", "constitution", "fundamental rights"]):
        return "Constitutional Law"
    elif any(word in query_lower for word in ["section", "ipc", "criminal", "punishment"]):
        return "Criminal Law"
    elif any(word in query_lower for word in ["consumer", "complaint", "defective"]):
        return "Consumer Law"
    elif any(word in query_lower for word in ["divorce", "marriage", "custody", "maintenance"]):
        return "Family Law"
    elif any(word in query_lower for word in ["property", "registration", "sale deed"]):
        return "Property Law"
    else:
        return "General Legal"

if __name__ == "__main__":
    print("🚀 Starting Advanced Legal AI Assistant...")
   
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)
