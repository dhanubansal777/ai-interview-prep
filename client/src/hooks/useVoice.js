import { useState, useEffect, useRef } from 'react';

// ---- Speech-to-text (microphone → text) ----
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;     // don't stop on short pauses
    recognition.interimResults = true; // update text as you speak
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + ' ';
      }
      setTranscript(text.trim());
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setTranscript('');
    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { isListening, transcript, isSupported, startListening, stopListening };
}

// ---- Text-to-speech (question → spoken aloud) ----
export function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // stop anything already playing
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}