import { useEffect, useRef, useState } from "react";
import ResultCard from "../components/ResultCard";
import VideoPanel from "../components/VideoPanel";
import { useAuth } from "../context/AuthContext";
import { useSocketContext } from "../context/SocketContext";

function LiveAttendancePage() {
  const CAPTURE_SIZE = 160;
  const FRAME_INTERVAL_MS = 400;
  const MATCH_THRESHOLD = 0.7;
  const REQUIRED_MATCH_FRAMES = 5;
  const REQUIRED_MISS_FRAMES = 5;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const matchCountRef = useRef(0);
  const missCountRef = useRef(0);
  const { user } = useAuth();
  const { socket, isConnected, lastError } = useSocketContext();
  const [name, setName] = useState("-");
  const [confidence, setConfidence] = useState(0);
  const [status, setStatus] = useState("Not Detected");
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (error) {
        setCameraError(error.message || "Unable to access webcam.");
      }
    }

    startCamera();

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const onSocketResult = (payload) => {
      console.log("Socket result payload:", payload);

      if (!isScanning || attendanceSaved) {
        return;
      }

      if (payload?.status === "error") {
        setResultMessage(payload?.message || "Recognition failed.");
        return;
      }

      if (payload?.status === "timeout") {
        setResultMessage(payload?.message || "Recognition request timed out.");
        return;
      }

      const similarity =
        typeof payload?.similarity === "number"
          ? payload.similarity
          : typeof payload?.confidence === "number"
            ? payload.confidence
            : 0;

      if (payload?.status === "not registered") {
        matchCountRef.current = 0;
        missCountRef.current = 0;
        setName(payload?.name || "-");
        setConfidence(similarity * 100);
        setStatus("Not Registered");
        setAttendanceSaved(false);
        setResultMessage("Face matched, but this student is not registered in your account.");
        setIsScanning(false);
        return;
      }

      if (payload?.status === "matched" && similarity > MATCH_THRESHOLD) {
        matchCountRef.current += 1;
        missCountRef.current = 0;

        if (matchCountRef.current >= REQUIRED_MATCH_FRAMES) {
          setName(payload?.name || "-");
          setConfidence(similarity * 100);
          setStatus("Recognized");
          setAttendanceSaved(true);
          setResultMessage("");
          setIsScanning(false);
        }
        return;
      }

      matchCountRef.current = 0;
      missCountRef.current += 1;

      if (missCountRef.current >= REQUIRED_MISS_FRAMES) {
        setName("-");
        setConfidence(0);
        setStatus("Not Detected");
        setAttendanceSaved(false);
        setResultMessage("");
        setIsScanning(false);
      }
    };

    socket.on("result", onSocketResult);

    return () => {
      socket.off("result", onSocketResult);
    };
  }, [socket, attendanceSaved, isScanning]);

  useEffect(() => {
    if (!socket || !isConnected || !isStreaming || !isScanning || !user?.id) {
      return undefined;
    }

    captureIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState < 2) {
        return;
      }

      canvas.width = CAPTURE_SIZE;
      canvas.height = CAPTURE_SIZE;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);

      const image = canvas.toDataURL("image/jpeg", 0.8);
      socket.emit("frame", { image, userId: user.id });
    }, FRAME_INTERVAL_MS);

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, [socket, isConnected, isStreaming, isScanning, user?.id]);

  const handleStart = () => {
    if (!user?.id) {
      setResultMessage("Please log in again before starting recognition.");
      return;
    }

    matchCountRef.current = 0;
    missCountRef.current = 0;
    setName("-");
    setConfidence(0);
    setStatus("Not Detected");
    setAttendanceSaved(false);
    setResultMessage("");
    setIsScanning(true);
  };

  return (
    <div className="page-grid live-grid">
      <VideoPanel videoRef={videoRef} canvasRef={canvasRef} title="Live Camera Feed" />
      <ResultCard
        result={{ name, confidence, status, attendanceSaved }}
        error={cameraError || lastError || resultMessage}
        isScanning={isScanning}
        onStart={handleStart}
      />
    </div>
  );
}

export default LiveAttendancePage;
