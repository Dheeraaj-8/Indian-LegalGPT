#!/usr/bin/env python3


import os
import requests
import time
from typing import Dict, Any

# Fast legal knowledge base
LEGAL_KNOWLEDGE = {
    "consumer": [
        "Consumer complaints can be filed at District Consumer Disputes Redressal Commission, State Commission, or National Commission depending on the value of goods/services.",
        "To file a consumer complaint, you need: 1) Written complaint with details, 2) Supporting documents, 3) Court fees, 4) Affidavit.",
        "The Consumer Protection Act covers defective goods, deficient services, unfair trade practices, and excessive pricing.",
        "Consumer courts can order replacement, refund, compensation, and punitive damages."
    ],
    "criminal": [
        "IPC Section 302 deals with punishment for murder.",
        "Section 498A of IPC deals with cruelty by husband or his relatives.",
        "CrPC Section 144 allows magistrates to issue orders in urgent cases of nuisance or apprehended danger."
    ],
    "constitutional": [
        "Article 21 of the Indian Constitution guarantees the right to life and personal liberty.",
        "The Right to Information Act, 2005 allows citizens to access government information.",
        "The Right to Education Act, 2009 guarantees free and compulsory education for children aged 6-14."
    ],
    "family": [
        "Section 125 of CrPC provides for maintenance of wives, children, and parents.",
        "The Protection of Women from Domestic Violence Act, 2005 provides civil remedies for domestic violence."
    ],
    "employment": [
        "The Minimum Wages Act, 1948 ensures minimum wages for workers in scheduled employments.",
        "The Factories Act, 1948 regulates working conditions in factories.",
        "The Industrial Disputes Act, 1947 provides machinery for investigation and settlement of industrial disputes.",
        "The Payment of Wages Act, 1936 regulates payment of wages to certain classes of employed persons.",
        "The Employees' Provident Funds and Miscellaneous Provisions Act, 1952 provides for provident fund, pension, and insurance for employees."
    ],
    "general": [
        "The Indian Evidence Act, 1872 governs admissibility of evidence.",
        "The Motor Vehicles Act, 1988 governs traffic rules, licensing, and accident compensation."
    ]
}

import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your-groq-api-key-here")
GROQ_MODEL = "llama-3.3-70b-versatile"

MAX_TOKENS_PER_CALL = 1500
REQUEST_TIMEOUT_SECONDS = 45
MAX_CONTINUE_CALLS = 3

def classify_legal_domain(query: str) -> str:
    """Fast legal domain classification"""
    query_lower = query.lower()
    
    if any(word in query_lower for word in ["consumer", "complaint", "defective", "service"]):
        return "consumer"
    elif any(word in query_lower for word in ["criminal", "murder", "punishment", "ipc", "section"]):
        return "criminal"
    elif any(word in query_lower for word in ["constitution", "article", "fundamental rights", "rti"]):
        return "constitutional"
    elif any(word in query_lower for word in ["divorce", "marriage", "custody", "maintenance", "domestic violence"]):
        return "family"
    elif any(word in query_lower for word in ["employment", "wages", "factory", "worker", "industrial"]):
        return "employment"
    else:
        return "general"

def get_relevant_knowledge(query: str) -> str:
    """Get relevant legal knowledge quickly"""
    domain = classify_legal_domain(query)
    knowledge = LEGAL_KNOWLEDGE.get(domain, LEGAL_KNOWLEDGE["general"])
    return "\n".join(knowledge)

def _groq_chat_with_autocontinue(messages: list[dict]) -> str:
    """Low-level Groq chat helper with auto-continue."""
    try:
        accumulated_response_parts: list[str] = []
        for i in range(MAX_CONTINUE_CALLS + 1):
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            data = {
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": 0.5,
                "max_tokens": MAX_TOKENS_PER_CALL,
            }
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            if response.status_code != 200:
                break
            payload = response.json()
            choice = payload.get("choices", [{}])[0]
            content = choice.get("message", {}).get("content", "")
            finish_reason = choice.get("finish_reason")
            if content:
                accumulated_response_parts.append(content)
            if finish_reason != "length" or i == MAX_CONTINUE_CALLS:
                break
            messages.append({"role": "assistant", "content": content})
            messages.append({"role": "user", "content": "Continue from where you left off. Do not repeat."})
        return "".join(accumulated_response_parts).strip()
    except Exception:
        return ""


def ask_groq_fast(question: str) -> str:
    """Fast Groq API call with auto-continue to avoid truncation"""
    try:
        messages = [
            {
                "role": "user",
                "content": (
                    "Answer this legal question in the context of Indian law. "
                    "Be thorough, structured with headings and steps, and concise where possible.\n\n"
                    f"Question: {question}"
                ),
            }
        ]

        content = _groq_chat_with_autocontinue(messages)
        if content:
            return content
        knowledge = get_relevant_knowledge(question)
        return f"Based on Indian legal knowledge: {knowledge}"
    except Exception:
        knowledge = get_relevant_knowledge(question)
        return f"Based on Indian legal knowledge: {knowledge}"


def generate_legal_document_fast(case_description: str, preferred_type: str | None = None) -> str:
    """Generate a formal Indian legal document from a case description using Groq.
    preferred_type can be one of: notice, affidavit, consumer complaint, rti application, property document.
    Returns Markdown content suitable for display or download."""
    try:
        doc_type_instruction = (
            f"Preferred document type: {preferred_type}. If inappropriate, choose the most suitable from: "
            "Legal notice, Affidavit, Consumer complaint, RTI application, Property document."
            if preferred_type else
            "Choose the most suitable type from: Legal notice, Affidavit, Consumer complaint, RTI application, Property document."
        )
        prompt = (
            "Act as an Indian legal document generator. Produce a professionally formatted document in Markdown.\n"
            f"{doc_type_instruction}\n"
            "Requirements:\n"
            "- Use formal Indian legal drafting style.\n"
            "- Include appropriate headings, party details placeholders, jurisdiction, facts, legal provisions, reliefs/prayers, verification/affirmation (if applicable).\n"
            "- Add placeholders like [Client Name], [Address], [Opposite Party], [Police Station], [Court], [Date], [Case Details].\n"
            "- Cite relevant statutory provisions (e.g., IPC, CrPC, CPC, Consumer Protection Act, RTI Act) where applicable.\n"
            "- End with a short 'Filing/Submission Instructions' section.\n"
            "- Keep confidential data as placeholders; do not invent personal details.\n"
            "Case Description:\n" + case_description
        )
        messages = [{"role": "user", "content": prompt}]
        content = _groq_chat_with_autocontinue(messages)
        return content or "Unable to generate the document. Please provide more details."
    except Exception:
        return "Unable to generate the document. Please try again later."

def ask_indian_legalgpt_fast(query: str) -> str:
    """Ultra-fast legal response"""
    try:
        # Try Groq first (fast)
        response = ask_groq_fast(query)
        return response
    except Exception as e:
        # Fallback to knowledge base
        knowledge = get_relevant_knowledge(query)
        return f"Based on Indian legal knowledge: {knowledge}"

def upload_document_to_rag_fast(file_path: str) -> str:
    """Fast document upload (placeholder)"""
    return f"Document {os.path.basename(file_path)} uploaded successfully (fast mode)"

def process_voice_input_fast(audio_path: str) -> str:
    """Fast voice processing (placeholder)"""
    return "Voice input processed (fast mode)"

def process_query_with_context_fast(query: str) -> str:
    """Fast query processing"""
    return ask_indian_legalgpt_fast(query) 
