import { useEffect, useRef, useState } from "react";
import "./InterviewRoom.css";

function InterviewRoom({ interview, onExit }) {
  const questions = interview?.questions || [];

  // =====================================================
  // STATE
  // =====================================================

  const [currentIndex, setCurrentIndex] = useState(0);

  const [answer, setAnswer] = useState("");

  const [isListening, setIsListening] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [isEvaluating, setIsEvaluating] = useState(false);

  const [cameraEnabled, setCameraEnabled] = useState(false);

  const [microphoneEnabled, setMicrophoneEnabled] =
    useState(false);

  const [audioLevel, setAudioLevel] = useState(0);

  const [error, setError] = useState("");

  const [evaluation, setEvaluation] = useState(null);

  const [finished, setFinished] = useState(false);

  // =====================================================
  // REFS
  // =====================================================

  const videoRef = useRef(null);

  const streamRef = useRef(null);

  const microphoneStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const mediaRecorderRef = useRef(null);

  const audioChunksRef = useRef([]);

  const audioContextRef = useRef(null);

  const analyserRef = useRef(null);

  const animationFrameRef = useRef(null);

  // =====================================================
  // CURRENT QUESTION
  // =====================================================

  const currentQuestion =
    questions[currentIndex];

  // =====================================================
  // INITIAL SETUP
  // =====================================================

  useEffect(() => {
    return () => {
      stopEverything();
      window.speechSynthesis.cancel();
    };
  }, []);

  // =====================================================
  // CAMERA + MICROPHONE
  // =====================================================


  const initializeMedia = async () => {
    try {
      setError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported by this browser.");
      }

      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      cameraStreamRef.current = cameraStream;
      streamRef.current = cameraStream;

      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream;
      }

      setCameraEnabled(true);
    } catch (err) {
      console.error("Camera permission error:", err);
      setCameraEnabled(false);
      setError("Camera access is unavailable. You can continue with microphone only.");
    }
  };

  // =====================================================
  // AUDIO ANALYSER
  // =====================================================

  const startAudioAnalyser = async () => {
    try {
      const stream =
        microphoneStreamRef.current;

      if (!stream) {
        console.error(
          "❌ Microphone stream missing"
        );

        return;
      }

      const audioTracks =
        stream.getAudioTracks();

      if (audioTracks.length === 0) {
        console.error(
          "❌ No audio tracks"
        );

        return;
      }

      console.log(
        "🎤 ANALYSER MICROPHONE:",
        audioTracks[0].label
      );

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        setError(
          "Audio analysis is not supported by this browser."
        );

        return;
      }

      const audioContext =
        new AudioContext();

      audioContextRef.current =
        audioContext;

      if (
        audioContext.state ===
        "suspended"
      ) {
        await audioContext.resume();
      }

      console.log(
        "🔊 AudioContext:",
        audioContext.state
      );

      const analyser =
        audioContext.createAnalyser();

      analyser.fftSize = 512;

      analyser.smoothingTimeConstant =
        0.4;

      analyserRef.current =
        analyser;

      const source =
        audioContext.createMediaStreamSource(
          stream
        );

      source.connect(analyser);

      const dataArray =
        new Uint8Array(
          analyser.fftSize
        );

      const updateLevel = () => {
        if (!analyserRef.current) {
          return;
        }

        analyser.getByteTimeDomainData(
          dataArray
        );

        let sum = 0;

        for (
          let i = 0;
          i < dataArray.length;
          i++
        ) {
          const value =
            (dataArray[i] - 128) / 128;

          sum += value * value;
        }

        const rms = Math.sqrt(
          sum / dataArray.length
        );

        const level = Math.min(
          100,
          Math.round(rms * 1000)
        );

        setAudioLevel(level);

        animationFrameRef.current =
          requestAnimationFrame(
            updateLevel
          );
      };

      updateLevel();

      console.log(
        "📊 Microphone analyser started"
      );

    } catch (err) {
      console.error(
        "❌ Audio analyser error:",
        err
      );

      setError(
        "Unable to read microphone audio."
      );
    }
  };

  // =====================================================
  // STOP AUDIO ANALYSER
  // =====================================================

  const stopAudioAnalyser = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current =
        null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (err) {
        console.log(err);
      }

      audioContextRef.current =
        null;
    }

    analyserRef.current = null;

    setAudioLevel(0);
  };

  // =====================================================
  // STOP EVERYTHING
  // =====================================================

  const stopEverything = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }

    mediaRecorderRef.current = null;

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }

    streamRef.current = null;

    stopAudioAnalyser();

    setIsListening(false);
    setCameraEnabled(false);
    setMicrophoneEnabled(false);
  };

  // =====================================================
  // AI SPEAK QUESTION
  // =====================================================

  const speakQuestion = () => {
    if (!currentQuestion) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(
        currentQuestion.question
      );

    speech.rate = 0.9;

    speech.pitch = 1;

    speech.volume = 1;

    speech.onstart = () => {
      setIsSpeaking(true);
    };

    speech.onend = () => {
      setIsSpeaking(false);
    };

    speech.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(
      speech
    );
  };

  // =====================================================
  // AUTO SPEAK QUESTION
  // =====================================================

  useEffect(() => {
    if (
      currentQuestion &&
      !finished
    ) {
      setAnswer("");

      setEvaluation(null);

      setError("");

  
      const timer =
        setTimeout(() => {
          speakQuestion();
        }, 700);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [
    currentIndex,
    finished,
  ]);

  // =====================================================
  // MIME TYPE
  // =====================================================

  const getAudioMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];

    for (const type of types) {
      if (
        MediaRecorder.isTypeSupported(
          type
        )
      ) {
        return type;
      }
    }

    return "";
  };

  // =====================================================
  // START SPEAKING
  // =====================================================

  const startListening = async () => {
    console.log("🎤 START SPEAKING CLICKED");

    if (isListening || isEvaluating) return;

    setError("");
    setAnswer("");
    setEvaluation(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not supported by this browser.");
      }

      // AUDIO ONLY stream for MediaRecorder.
      let micStream = microphoneStreamRef.current;

      if (
        !micStream ||
        micStream.getAudioTracks().every((track) => track.readyState !== "live")
      ) {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });

        microphoneStreamRef.current = micStream;
      }

      const audioTracks = micStream.getAudioTracks();

      if (!audioTracks.length) {
        throw new Error("No microphone detected. Check your Windows microphone settings.");
      }

      const audioTrack = audioTracks[0];
      audioTrack.enabled = true;

      if (audioTrack.readyState !== "live") {
        throw new Error("Microphone is not active. Please check your microphone.");
      }

      setMicrophoneEnabled(true);
      console.log("🎤 Microphone:", audioTrack.label);

      // CAMERA is separate from the recorder stream.
      let cameraStream = cameraStreamRef.current;

      if (
        !cameraStream ||
        cameraStream.getVideoTracks().every((track) => track.readyState !== "live")
      ) {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });

          cameraStreamRef.current = cameraStream;

          if (videoRef.current) {
            videoRef.current.srcObject = cameraStream;
          }

          setCameraEnabled(true);
        } catch (cameraError) {
          console.warn("Camera unavailable:", cameraError);
          setCameraEnabled(false);
        }
      }

      await startAudioAnalyser();

      if (!window.MediaRecorder) {
        throw new Error("Audio recording is not supported in this browser.");
      }

      const mimeType = getAudioMimeType();
      console.log("🎤 MIME TYPE:", mimeType || "browser default");

      const recorder = mimeType
        ? new MediaRecorder(micStream, {
            mimeType,
            audioBitsPerSecond: 128000,
          })
        : new MediaRecorder(micStream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        console.log("🎤 AUDIO CHUNK:", event.data?.size || 0);

        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        console.log("🔴 AUDIO RECORDING STARTED");
        setIsListening(true);
        setError("");
      };

      recorder.onerror = (event) => {
        console.error("❌ MediaRecorder error:", event);
        setIsListening(false);
        stopAudioAnalyser();
        setError("Audio recording failed. Please check your microphone.");
      };

      recorder.onstop = async () => {
        console.log("⏹ AUDIO RECORDING STOPPED");

        setIsListening(false);
        stopAudioAnalyser();

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });

        console.log("🎤 FINAL AUDIO SIZE:", audioBlob.size);
        console.log("🎤 TOTAL AUDIO CHUNKS:", audioChunksRef.current.length);

        if (audioBlob.size === 0) {
          setError("No audio was recorded. Please check your microphone.");
          return;
        }

        // Browser SpeechRecognition is intentionally not used.
        // Django receives the real recorded audio and Gemini
        // performs transcription + evaluation.
        await submitAudioAnswer(audioBlob);
      };

      recorder.start(250);
      console.log("🎤 MediaRecorder started successfully");

    } catch (err) {
      console.error("❌ START SPEAKING ERROR:", err);

      setIsListening(false);
      stopAudioAnalyser();


      setError(err?.message || "Unable to start microphone recording.");
    }
  };

  // =====================================================
  // STOP SPEAKING
  // =====================================================

  const stopListening = () => {
    console.log("⏹ STOP SPEAKING CLICKED");

    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state === "recording") {
      recorder.stop();
      return;
    }

    setIsListening(false);
    stopAudioAnalyser();
  };

  // =====================================================
  // SUBMIT ANSWER
  // =====================================================

  const submitAudioAnswer =
    async (
      audioBlob
    ) => {
      if (!currentQuestion) {
        return;
      }

      setIsEvaluating(true);

      setError("");

      try {
        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again."
          );
        }

        const formData =
          new FormData();

        formData.append(
          "audio",
          audioBlob,
          "answer.webm"
        );


        /*
          IMPORTANT:
          This URL must exist in Django.
        */

        const url =
          `http://127.0.0.1:8000/api/interviews/` +
          `${interview.id}/questions/` +
          `${currentQuestion.id}/answer/`;

        console.log(
          "📤 Sending answer:",
          url
        );

        const response =
          await fetch(url, {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          });

        const contentType =
          response.headers.get(
            "content-type"
          );

        let data;

        if (
          contentType &&
          contentType.includes(
            "application/json"
          )
        ) {
          data =
            await response.json();
        } else {
          const text =
            await response.text();

          console.error(
            "Backend response:",
            text
          );

          throw new Error(
            "Backend returned an invalid response."
          );
        }

        console.log(
          "📥 Backend:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.error ||
            data.detail ||
            "Failed to evaluate answer."
          );
        }

        setAnswer(
          data.transcript ||
          "AI could not generate a transcript."
        );

        setEvaluation({
          score:
            data.score,

          feedback:
            data.feedback || "",
        });

      } catch (err) {
        console.error(
          "❌ Submit answer error:",
          err
        );

        /*
          Even if backend evaluation fails,
          keep the recognized answer visible.
        */

        setAnswer(
          "Audio was recorded, but AI evaluation failed. Please try again."
        );

        setError(
          err.message ||
          "Failed to evaluate answer."
        );

      } finally {
        setIsEvaluating(false);
      }
    };

  // =====================================================
  // NEXT QUESTION
  // =====================================================

  const handleNext = () => {
    if (!answer.trim()) {
      setError(
        "Please answer the question first."
      );

      return;
    }

    if (isListening) {
      setError(
        "Please stop speaking first."
      );

      return;
    }

    if (isEvaluating) {
      setError(
        "Please wait for AI evaluation."
      );

      return;
    }

    setError("");

    window.speechSynthesis.cancel();

    if (
      currentIndex <
      questions.length - 1
    ) {
      setCurrentIndex(
        (prev) => prev + 1
      );
    } else {
      setFinished(true);
    }
  };

  // =====================================================
  // FINISHED
  // =====================================================

  if (finished) {
    return (
      <div className="interview-finished">
        <div className="finished-card">

          <div className="finished-icon">
            🎉
          </div>

          <h1>
            Interview Completed!
          </h1>

          <p>
            Great job! You completed
            your AI mock interview.
          </p>

          <div className="finished-summary">
            <strong>
              {questions.length}
            </strong>

            <span>
              Questions Completed
            </span>
          </div>

          <button
            className="exit-btn"
            onClick={onExit}
          >
            ← Back to Dashboard
          </button>

        </div>
      </div>
    );
  }

  // =====================================================
  // NO QUESTIONS
  // =====================================================

  if (!currentQuestion) {
    return (
      <div className="interview-error-page">

        <h2>
          No interview questions found.
        </h2>

        <button onClick={onExit}>
          ← Back to Dashboard
        </button>

      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="interview-room">

      {/* NAVBAR */}

      <nav className="interview-room-nav">

        <div className="room-logo">
          🤖 AI Interview Portal
        </div>

        <div className="room-role">
          {interview.role}
        </div>

        <button
          className="leave-btn"
          onClick={onExit}
        >
          Exit Interview
        </button>

      </nav>

      {/* MAIN */}

      <main className="interview-main">

        {/* HEADER */}

        <div className="interview-header">

          <div>
            <h1>
              AI Mock Interview
            </h1>

            <p>
              {interview.difficulty
                ?.charAt(0)
                .toUpperCase() +
                interview.difficulty?.slice(
                  1
                )}{" "}
              Interview
            </p>
          </div>

          <div className="question-counter">
            Question{" "}
            {currentIndex + 1} /{" "}
            {questions.length}
          </div>

        </div>

        {/* INTERVIEW GRID */}

        <div className="interview-grid">

          {/* AI */}

          <section className="ai-panel">

            <div className="panel-title">
              🤖 AI Interviewer
            </div>

            <div
              className={`ai-avatar ${isSpeaking
                ? "speaking"
                : ""
                }`}
            >
              🤖
            </div>

            <div className="ai-status">

              {isSpeaking
                ? "🔊 AI is speaking..."
                : isListening
                  ? "🎤 Listening..."
                  : isEvaluating
                    ? "🤖 Evaluating..."
                    : "👂 Ready"}

            </div>

            <button
              className="repeat-btn"
              onClick={
                speakQuestion
              }
              disabled={
                isSpeaking ||
                isListening ||
                isEvaluating
              }
            >
              🔊 Repeat Question
            </button>

          </section>

          {/* CAMERA */}

          <section className="camera-panel">

            <div className="panel-title">
              🎥 You
            </div>

            <div className="camera-container">

              {cameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <div className="camera-placeholder">
                  📷
                  <span>
                    Camera unavailable
                  </span>
                </div>
              )}

            </div>

            <div className="camera-status">

              {cameraEnabled &&
                microphoneEnabled
                ? "● Camera & microphone active"
                : "● Camera unavailable"}

            </div>

          </section>

        </div>

        {/* QUESTION */}

        <section className="question-card">

          <div className="question-label">
            AI Interviewer asks:
          </div>

          <h2>
            {currentQuestion.question}
          </h2>

        </section>

        {/* ANSWER */}

        <section className="answer-card">

          <div className="answer-header">

            <span>
              🎤 Your Answer
            </span>

            {isListening && (
              <span className="listening">
                🔴 Recording...
              </span>
            )}

            {isEvaluating && (
              <span className="listening">
                🤖 Evaluating...
              </span>
            )}

          </div>

          {/* MICROPHONE LEVEL */}

          {isListening && (
            <div
              className="microphone-meter"
              style={{
                marginBottom: "15px",
                padding: "12px",
                background:
                  "#f5f7ff",
                borderRadius: "10px",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: "7px",
                }}
              >

                <span>
                  🎤 Microphone Level
                </span>

                <span>
                  {audioLevel}%
                </span>

              </div>

              <div
                style={{
                  width: "100%",
                  height: "12px",
                  background:
                    "#dddddd",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >

                <div
                  style={{
                    width:
                      `${audioLevel}%`,
                    height: "100%",
                    background:
                      audioLevel > 5
                        ? "#22c55e"
                        : "#ef4444",
                    transition:
                      "width 0.1s linear",
                  }}
                />

              </div>

              <small
                style={{
                  display: "block",
                  marginTop: "7px",
                  color:
                    audioLevel > 5
                      ? "#15803d"
                      : "#dc2626",
                }}
              >

                {audioLevel > 5
                  ? "🎙️ Voice detected"
                  : "🔇 No voice detected"}

              </small>

            </div>
          )}

          {/* ANSWER TEXT */}

          <div className="answer-box">

            {isEvaluating ? (
              <span className="answer-placeholder">
                🤖 AI is evaluating
                your answer...
              </span>
            ) : answer ? (
              answer
            ) : (
              <span className="answer-placeholder">
                Click "Start Speaking"
                and answer the question.
                Gemini will transcribe and evaluate
                your recorded answer...
              </span>
            )}

          </div>

          {/* EVALUATION */}

          {evaluation && (
            <div className="answer-evaluation">

              <h3>
                🤖 AI Evaluation
              </h3>

              <p>
                <strong>
                  Score:
                </strong>{" "}
                {evaluation.score}/10
              </p>

              <p>
                <strong>
                  Feedback:
                </strong>{" "}
                {evaluation.feedback}
              </p>

            </div>
          )}

          {/* BUTTONS */}

          <div className="voice-controls">

            {!isListening ? (

              <button
                type="button"
                className="speak-btn"
                onClick={startListening}
                disabled={isEvaluating}
              >
                  🎤 Start Speaking
              </button>

            ) : (

              <button
                className="stop-btn"
                onClick={
                  stopListening
                }
              >
                ⏹ Stop Speaking
              </button>

            )}

            <button
              className="next-btn"
              onClick={
                handleNext
              }
              disabled={
                !answer.trim() ||
                isListening ||
                isEvaluating
              }
            >
              {currentIndex ===
                questions.length - 1
                ? "Finish Interview →"
                : "Next Question →"}
            </button>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="room-error">
            {error}
          </div>
        )}

      </main>

    </div>
  );
}

export default InterviewRoom;