"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

interface RecorderSegment {
  speaker: string;
  text: string;
  timestamp: string;
}

interface UseMeetingRecorderReturn {
  isRecording: boolean;
  segments: RecorderSegment[];
  duration: number;
  audioLevel: number;
  startRecording: (meetingId: number) => void;
  stopRecording: () => void;
  error: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const FLUSH_INTERVAL_MS = 10000; // Send segments to backend every 10 seconds
const SPEAKER_LABEL = "Advisor"; // Default speaker until speaker diarization is available

/**
 * Continuous meeting transcription hook.
 *
 * Uses the Web Speech API with continuous=true for real-time meeting
 * transcription. Automatically restarts recognition on end events
 * (browser implementations often stop after silence). Accumulates
 * transcript segments with timestamps and flushes them to the backend
 * every 10 seconds.
 */
export function useMeetingRecorder(): UseMeetingRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [segments, setSegments] = useState<RecorderSegment[]>([]);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any | null>(null);
  const meetingIdRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const pendingSegmentsRef = useRef<RecorderSegment[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);

  // ─── Audio Level Monitoring ────────────────────────────

  const startAudioMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      function updateLevel() {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        // Calculate RMS-like average level normalized to 0-1
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        setAudioLevel(avg);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }

      updateLevel();
    } catch {
      // Audio monitoring is non-critical; continue recording without it
      setAudioLevel(0);
    }
  }, []);

  const stopAudioMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // ─── Flush pending segments to backend ─────────────────

  const flushSegments = useCallback(async () => {
    const meetingId = meetingIdRef.current;
    const pending = pendingSegmentsRef.current;
    if (!meetingId || pending.length === 0) return;

    // Take all pending segments and clear the buffer
    const toSend = [...pending];
    pendingSegmentsRef.current = [];

    try {
      await apiClient.appendTranscript(meetingId, toSend);
    } catch {
      // If flush fails, put segments back at the front so they retry next cycle
      pendingSegmentsRef.current = [...toSend, ...pendingSegmentsRef.current];
    }
  }, []);

  // ─── Speech Recognition Setup ──────────────────────────

  const createRecognition = useCallback((): any | null => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: { resultIndex: number; results: SpeechRecognitionResultList }) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            const segment: RecorderSegment = {
              speaker: SPEAKER_LABEL,
              text,
              timestamp: new Date().toISOString(),
            };

            setSegments((prev) => [...prev, segment]);
            pendingSegmentsRef.current.push(segment);
          }
        }
      }
    };

    recognition.onerror = (event: { error: string }) => {
      // "aborted" fires when we intentionally stop; "no-speech" is normal during silence
      if (event.error === "aborted" || event.error === "no-speech") return;

      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone permissions.");
        isRecordingRef.current = false;
        setIsRecording(false);
        return;
      }

      // For network or service errors, the auto-restart in onend will handle recovery
      console.warn("[MeetingRecorder] Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      // Auto-restart if we're still supposed to be recording
      // Browser implementations stop after silence or internal timeouts
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          // If restart fails, wait a moment then try with a fresh instance
          setTimeout(() => {
            if (isRecordingRef.current) {
              const newRecognition = createRecognition();
              if (newRecognition) {
                recognitionRef.current = newRecognition;
                try {
                  newRecognition.start();
                } catch {
                  setError("Failed to restart speech recognition");
                  isRecordingRef.current = false;
                  setIsRecording(false);
                }
              }
            }
          }, 500);
        }
      }
    };

    return recognition;
  }, []);

  // ─── Public API ────────────────────────────────────────

  const startRecording = useCallback(
    (meetingId: number) => {
      setError(null);
      setSegments([]);
      setDuration(0);
      pendingSegmentsRef.current = [];
      meetingIdRef.current = meetingId;

      const recognition = createRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      isRecordingRef.current = true;

      try {
        recognition.start();
      } catch {
        setError("Failed to start speech recognition");
        return;
      }

      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Duration timer -- update every second
      durationTimerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Flush timer -- send segments to backend periodically
      flushTimerRef.current = setInterval(() => {
        flushSegments();
      }, FLUSH_INTERVAL_MS);

      // Start audio level monitoring
      startAudioMonitoring();
    },
    [createRecognition, flushSegments, startAudioMonitoring]
  );

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped
      }
      recognitionRef.current = null;
    }

    // Clear timers
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    // Final flush of any remaining segments
    flushSegments();

    // Stop audio monitoring
    stopAudioMonitoring();

    meetingIdRef.current = null;
  }, [flushSegments, stopAudioMonitoring]);

  // ─── Cleanup on unmount ────────────────────────────────

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Already stopped
        }
      }

      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
      }

      // Flush remaining segments on unmount
      const meetingId = meetingIdRef.current;
      const pending = pendingSegmentsRef.current;
      if (meetingId && pending.length > 0) {
        apiClient.appendTranscript(meetingId, pending).catch(() => {});
      }

      stopAudioMonitoring();
    };
  }, [stopAudioMonitoring]);

  return {
    isRecording,
    segments,
    duration,
    audioLevel,
    startRecording,
    stopRecording,
    error,
  };
}
