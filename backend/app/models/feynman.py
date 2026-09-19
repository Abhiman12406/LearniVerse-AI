"""Pydantic models for Feynman Agent Multimodal Adaptive Explanation System conforming to FEYNMAN.md."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VisualStep(BaseModel):
    """Step frame in an interactive visual diagram or trace."""
    step_number: int = Field(..., description="1-indexed step in the sequence")
    title: str = Field(..., description="Step title or headline")
    description: str = Field(..., description="Conceptual description of this step")
    visual_state: Dict[str, Any] = Field(default_factory=dict, description="State items e.g. stack frames, pointers")
    highlight_element: Optional[str] = Field(None, description="Key element to draw attention to")
    analogy_note: Optional[str] = Field(None, description="Feynman analogy cue for this step")


class VideoFrame(BaseModel):
    """Timestamped keyframe in an AI-generated/simulated concept video."""
    timestamp_sec: float = Field(..., description="Video offset in seconds")
    caption: str = Field(..., description="Voiceover/subtitle narration")
    frame_type: str = Field(default="animation", description="animation | diagram | code_trace | summary")
    visual_data: Dict[str, Any] = Field(default_factory=dict, description="Rendering parameters for video player")


class ThreeDApparatusInstruction(BaseModel):
    """Commands for the 3D Classroom game world upon 3D explanation."""
    action: str = Field(default="SHOW_3D_EXPLANATION", description="Game agent instruction")
    concept: str = Field(..., description="Target DSA concept")
    zone: str = Field(..., description="Target classroom zone e.g. stack_lab or recursion_lab")
    visualization: str = Field(..., description="Visualization type e.g. call_stack or lifo_cylinder")
    focus_elements: List[str] = Field(default_factory=list, description="Apparatus elements to highlight")
    camera_target: Optional[List[float]] = Field(None, description="[x, y, z] coordinates to focus camera")


class FeynmanDecision(BaseModel):
    """Structured decision produced by the Feynman Analyzer Agent."""
    decision_id: str = Field(..., description="Unique decision ID")
    concept_id: str = Field(..., description="DSA concept: stack, recursion, array, linked_list, tree")
    problem: str = Field(..., description="Identified root difficulty")
    modality: str = Field(..., description="Selected modality: TEXT | VISUAL | VOICE | VIDEO | 3D")
    difficulty: str = Field(default="BEGINNER", description="BEGINNER | INTERMEDIATE | ADVANCED")
    learning_objective: str = Field(..., description="Target learning objective")
    reason: str = Field(..., description="Pedagogical rationale behind modality and focus selection")
    understood: List[str] = Field(default_factory=list, description="Aspects student already understands")
    gaps: List[str] = Field(default_factory=list, description="Specific knowledge gaps detected")
    misconceptions: List[str] = Field(default_factory=list, description="Specific misconceptions detected")
    confidence: float = Field(default=0.90, ge=0.0, le=1.0, description="Confidence in diagnosis")


class VerificationQuestion(BaseModel):
    """Short targeted question to verify understanding after explanation."""
    question_id: str = Field(..., description="Unique question ID")
    prompt: str = Field(..., description="Question text")
    options: List[str] = Field(..., description="Multiple choice options")
    correct_option_index: int = Field(..., description="0-indexed correct option")
    explanation: str = Field(..., description="Why the correct option is right")
    tested_skill: str = Field(..., description="Specific skill or gap tested")


class FeynmanExplanationPayload(BaseModel):
    """Multimodal explanation bundle returned to the student."""
    title: str = Field(..., description="Explanation headline")
    modality: str = Field(..., description="Primary delivered modality")
    analogy: str = Field(..., description="Everyday concrete Feynman analogy")
    detailed_explanation: str = Field(..., description="Clear step-by-step conceptual explanation")
    code_or_trace: Optional[str] = Field(None, description="Code snippet or execution trace")
    visual_steps: List[VisualStep] = Field(default_factory=list, description="Step-by-step diagram frames")
    voice_script: str = Field(..., description="Narration text formatted for TTS audio synthesis")
    video_timeline: List[VideoFrame] = Field(default_factory=list, description="Animated video simulation frames")
    three_d_instruction: Optional[ThreeDApparatusInstruction] = Field(None, description="3D classroom apparatus trigger")


class TranscribeRequest(BaseModel):
    """Request payload for audio speech-to-text transcription using Groq Whisper."""
    audio_base64: Optional[str] = Field(None, description="Base64 encoded audio bytes")
    audio_format: str = Field(default="webm", description="Audio format/extension: webm | wav | mp3 | m4a | ogg")
    language: str = Field(default="en", description="Language ISO code e.g. en")
    prompt: Optional[str] = Field(None, description="Optional Whisper conditioning prompt for DSA context")


class TranscribeResponse(BaseModel):
    """Transcription response from Groq Whisper."""
    transcript: str = Field(..., description="Transcribed question or explanation text")
    provider: str = Field(default="groq_whisper", description="Speech recognition provider: groq_whisper | groq_whisper_simulated")
    model: str = Field(default="whisper-large-v3", description="Whisper model deployed")
    success: bool = Field(default=True, description="Whether transcription succeeded")
    warning: Optional[str] = Field(None, description="Warning note if fallback or simulated transcription was used")


class FeynmanRequest(BaseModel):
    """Inbound student request for Feynman assistance."""
    student_id: str = Field(default="learner_b", description="Learner ID")
    concept_id: str = Field(default="recursion", description="Concept: stack | recursion | array | linked_list | tree")
    input_type: str = Field(default="TEXT", description="TEXT | AUDIO | VOICE | IMAGE | CODE | GAME_EVENT")
    input: str = Field(default="", description="Student's question, spoken query, or struggle description")
    audio_base64: Optional[str] = Field(None, description="Optional base64 encoded audio for Groq Whisper transcription")
    requested_modality: Optional[str] = Field(None, description="Optional student preference: TEXT | VISUAL | VOICE | VIDEO | 3D")
    activity_id: Optional[str] = Field(None, description="Contextual activity or question ID")


class FeynmanResponse(BaseModel):
    """Complete response returned to the client upon asking Feynman."""
    session_id: str = Field(..., description="Session identifier for audit and verification")
    student_id: str = Field(..., description="Learner ID")
    concept_id: str = Field(..., description="Concept evaluated")
    input_type: str = Field(..., description="Modality of original input")
    unified_input: str = Field(..., description="Normalized text transcript or prompt")
    decision: FeynmanDecision = Field(..., description="Analyzer decision")
    explanation: FeynmanExplanationPayload = Field(..., description="Multimodal explanation content")
    verification_question: VerificationQuestion = Field(..., description="Targeted verification challenge")
    strategy_history: List[Dict[str, Any]] = Field(default_factory=list, description="Personalized strategy history")
    orchestrator: str = Field(default="google_genai", description="google_genai | builtin_engine | n8n")
    llm_mode: str = Field(default="deterministic_fallback", description="google_genai | cached_google_genai | deterministic_fallback")
    cache_status: Optional[str] = Field(default=None, description="HIT | MISS | BYPASS")
    cache_provider: Optional[str] = Field(default=None, description="redis_langcache | in_memory_fallback")
    latency_saved_ms: Optional[float] = Field(default=None, description="Estimated milliseconds saved by cache hit")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class VerificationRequest(BaseModel):
    """Submission of answer to Feynman verification question."""
    session_id: str = Field(..., description="Feynman session ID")
    student_id: str = Field(default="learner_b", description="Student ID")
    concept_id: str = Field(..., description="DSA concept tested")
    question_id: str = Field(..., description="Question ID")
    selected_option_index: Optional[int] = Field(None, description="Selected option index (0-3)")
    text_answer: Optional[str] = Field(None, description="Optional written explanation")
    response_time_ms: int = Field(default=4500, description="Response time in milliseconds")


class LearningEvidence(BaseModel):
    """Authoritative educational evidence produced by Feynman verification."""
    evidence_id: str = Field(..., description="Unique evidence ID")
    student_id: str = Field(..., description="Learner ID")
    concept_id: str = Field(..., description="DSA concept")
    source: str = Field(default="feynman_agent", description="Evidence source")
    evidence_type: str = Field(default="FEYNMAN_VERIFICATION", description="Evidence category")
    skill: str = Field(..., description="Specific skill or gap verified")
    correct: bool = Field(..., description="Whether student demonstrated correct understanding")
    confidence: float = Field(default=0.88, ge=0.0, le=1.0, description="Confidence in assessment")
    response_time_ms: int = Field(default=4500, description="Response time in ms")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class VerificationResponse(BaseModel):
    """Result of verification answer evaluation, BKT update, and world adaptation."""
    session_id: str
    student_id: str
    concept_id: str
    correct: bool
    feedback: str
    evidence: LearningEvidence
    prior_mastery: float
    posterior_mastery: float
    delta: float
    threshold_crossed: bool
    unlocked_wing: Optional[str]
    learner_profile: Dict[str, Any]
    world_delta: Dict[str, Any]
    deliberation: Optional[Dict[str, Any]] = None


class LearnerContextResponse(BaseModel):
    """Contextual learning snapshot matching FEYNMAN.md Section 12."""
    student_id: str
    concept: str
    mastery: float
    prerequisites: Dict[str, float]
    recent_mistakes: List[str]
    recent_attempts: List[Dict[str, Any]]
    current_activity: str
    persona_type: str
