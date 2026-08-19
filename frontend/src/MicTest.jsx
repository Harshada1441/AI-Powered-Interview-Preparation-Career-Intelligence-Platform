import { useRef, useState } from "react";

function MicTest() {
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState("Mic not started");

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const startTest = async () => {
    try {
      setStatus("Requesting microphone...");

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      const track = stream.getAudioTracks()[0];

      console.log("🎤 Device:", track.label);
      console.log("🎤 Enabled:", track.enabled);
      console.log("🎤 Muted:", track.muted);
      console.log("🎤 Ready:", track.readyState);

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      const context = new AudioContext();

      audioContextRef.current = context;

      await context.resume();

      const analyser =
        context.createAnalyser();

      analyser.fftSize = 512;

      analyserRef.current = analyser;

      const source =
        context.createMediaStreamSource(stream);

      source.connect(analyser);

      const data =
        new Uint8Array(analyser.fftSize);

      const checkLevel = () => {
        analyser.getByteTimeDomainData(data);

        let sum = 0;

        for (let i = 0; i < data.length; i++) {
          const value =
            (data[i] - 128) / 128;

          sum += value * value;
        }

        const rms =
          Math.sqrt(sum / data.length);

        const currentLevel = Math.min(
          100,
          Math.round(rms * 1000)
        );

        setLevel(currentLevel);

        animationRef.current =
          requestAnimationFrame(checkLevel);
      };

      checkLevel();

      setStatus("🎤 Microphone is active");

    } catch (error) {
      console.error(error);

      setStatus(
        "❌ Microphone permission/device error"
      );
    }
  };

  const stopTest = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setLevel(0);
    setStatus("Mic stopped");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          width: "450px",
          padding: "35px",
          background: "white",
          borderRadius: "20px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h1>🎤 Microphone Test</h1>

        <p>{status}</p>

        <h2>{level}%</h2>

        <div
          style={{
            width: "100%",
            height: "20px",
            background: "#ddd",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${level}%`,
              height: "100%",
              background:
                level > 5
                  ? "#22c55e"
                  : "#ef4444",
            }}
          />
        </div>

        <p>
          {level > 5
            ? "🎙️ Voice detected"
            : "🔇 No voice detected"}
        </p>

        <button
          onClick={startTest}
          style={{
            padding: "12px 25px",
            margin: "10px",
            cursor: "pointer",
          }}
        >
          🎤 Start Mic Test
        </button>

        <button
          onClick={stopTest}
          style={{
            padding: "12px 25px",
            cursor: "pointer",
          }}
        >
          ⏹ Stop
        </button>
      </div>
    </div>
  );
}

export default MicTest;