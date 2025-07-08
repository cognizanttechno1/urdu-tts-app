import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const UrduTTSApp = () => {
  const [textInputs, setTextInputs] = useState({
    text1: localStorage.getItem("text1") || "",
    text2: localStorage.getItem("text2") || "",
    text3: localStorage.getItem("text3") || "",
  });

  const [fontSize, setFontSize] = useState(24); // Only for word display now
  const [rate, setRate] = useState(1);
  const [highlightedWord, setHighlightedWord] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [activeField, setActiveField] = useState(null);

  const synthRef = useRef(window.speechSynthesis);
  const wordListRef = useRef([]);
  const voiceRef = useRef(null);

  // ✅ Voice selection logic
  const bindVoice = () => {
    const voices = synthRef.current.getVoices();
    const preferredVoices = ["ur-PK", "ur", "hi-IN"];

    const matched = preferredVoices
      .map((lang) => voices.find((v) => v.lang === lang))
      .find(Boolean);

    voiceRef.current = matched || voices.find((v) => v.lang.startsWith("ur")) || voices[0];
    console.log("✅ Selected voice:", voiceRef.current?.name, voiceRef.current?.lang);
  };

  useEffect(() => {
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = bindVoice;
    }
    bindVoice(); // Call on mount
  }, []);

  useEffect(() => {
    Object.entries(textInputs).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }, [textInputs]);

  const speakWordByIndex = (index) => {
    if (index >= wordListRef.current.length) {
      setIsReading(false);
      setHighlightedWord(null);
      return;
    }

    const word = wordListRef.current[index];
    setHighlightedWord(word);
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = voiceRef.current?.lang || "ur-PK";
    utterance.voice = voiceRef.current;
    utterance.rate = rate;

    utterance.onend = () => {
      setCurrentWordIndex((prev) => prev + 1);
    };

    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    if (isReading) {
      speakWordByIndex(currentWordIndex);
    }
  }, [currentWordIndex, isReading]);

  const startAutoReading = (field) => {
    stopSpeech();
    const text = textInputs[field];
    if (!text.trim()) return;

    wordListRef.current = text.trim().split(" ");
    setCurrentWordIndex(0);
    setIsReading(true);
  };

  const resumeAutoReading = () => {
    if (!isReading && wordListRef.current.length > 0) {
      setIsReading(true);
    }
  };

  const stopSpeech = () => {
    synthRef.current.cancel();
    setIsReading(false);
    setHighlightedWord(null);
  };

  const handleWordClick = (word) => {
    stopSpeech();
    setHighlightedWord(word);
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = voiceRef.current?.lang || "ur-PK";
    utterance.voice = voiceRef.current;
    utterance.rate = rate;

    utterance.onend = () => {
      setHighlightedWord(null);
    };

    synthRef.current.speak(utterance);
  };

  const renderWordByWord = (text) => {
    return text
      .split(" ")
      .filter(Boolean)
      .map((word, i) => (
        <span
          key={i}
          onClick={() => handleWordClick(word)}
          className={word === highlightedWord ? "highlight" : ""}
        >
          {word}
        </span>
      ));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTextInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClear = (field) => {
    const updated = { ...textInputs, [field]: "" };
    setTextInputs(updated);
    localStorage.setItem(field, "");
    stopSpeech();
  };

  const handleManualSave = (field) => {
    localStorage.setItem(field, textInputs[field]);
    alert("✅ Saved successfully!");
  };

  return (
    <div className="app-container">
      <h1>🗣️ Urdu TTS App</h1>

      {["text1", "text2", "text3"].map((field, idx) => (
        <div
          key={field}
          className={`text-block ${activeField === field ? "active-block" : ""}`}
        >
          <textarea
            name={field}
            value={textInputs[field]}
            onChange={handleChange}
            placeholder={`Enter Urdu Paragraph ${idx + 1}`}
            style={{ fontSize: 24, fontFamily: "Jameel Noori Nastaleeq" }}
            onFocus={() => setActiveField(field)}
          />

          <div className="button-group">
            <button onClick={() => startAutoReading(field)}>🔊 Auto Read</button>
            <button onClick={resumeAutoReading}>▶️ Resume</button>
            <button onClick={stopSpeech}>⏹️ Stop</button>
            <button onClick={() => handleClear(field)}>🧹 Clear</button>
            <button onClick={() => handleManualSave(field)}>💾 Save</button>
          </div>

          <div
            className="word-by-word"
            style={{ fontSize: fontSize }}
          >
            {renderWordByWord(textInputs[field])}
          </div>
        </div>
      ))}

      <div className="controls">
        <label>🔠 Font Size:</label>
        <input
          type="range"
          min="16"
          max="48"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
        />

        <label>🎚️ Speed:</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default UrduTTSApp;
