# 05: Multimodal Feynman Agent Demonstration & Verification

**What to build:** An end-to-end demonstration of the multimodal Feynman Agent with dual invocation: (1) automatically suggested as an ambient prompt when a student struggles or misses an in-lab challenge, and (2) on-demand through an explicit "Demonstrate Feynman Agent" trigger in the HUD and lab console header. The experience showcases all 5 explanation modalities (Text analogy, Visual interactive diagram, Voice input transcription via Groq Whisper with speech playback, Video animation steps, and 3D kinetic apparatus demonstration) along with an interactive verification quiz that directly updates BKT mastery upon completion.

**Blocked by:** 04: In-Lab Kinetic Activities with Live Mastery Sync

**Status:** completed

- [x] Ambient intervention banner appears when an in-lab challenge question is missed, offering instant Feynman help.
- [x] Explicit "Demonstrate Feynman Agent" button is available in the top HUD and lab console headers.
- [x] Student can toggle between all 5 modalities: Text, Visual (SVG diagram), Voice (Groq Whisper), Video, and 3D apparatus.
- [x] Voice input allows microphone recording and transcription via Groq Whisper API (with simulated fallback).
- [x] 3D modality sends kinetic manipulation commands to the classroom apparatus.
- [x] Targeted Feynman verification question evaluates understanding and posts to `/api/feynman/verify` to update BKT mastery.
