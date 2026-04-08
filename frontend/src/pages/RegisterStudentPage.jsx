import { useEffect, useRef, useState } from "react";
import { createStudent } from "../api/attendance";
import VideoPanel from "../components/VideoPanel";

function RegisterStudentPage() {
  const CAPTURE_SIZE = 160;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (cameraError) {
        setError(cameraError.message || "Unable to access webcam.");
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      throw new Error("Camera is not ready yet.");
    }

    canvas.width = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const image = captureImage();
      const data = await createStudent({ name, image });
      setMessage(data.message);
      setName("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-grid register-grid">
      <VideoPanel videoRef={videoRef} canvasRef={canvasRef} title="Capture Student Face" />
      <section className="panel form-panel">
        <div className="panel__header">
          <h3>Add Student</h3>
        </div>
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            Student Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter full name"
              required
            />
          </label>
          {message ? <div className="alert alert--success">{message}</div> : null}
          {error ? <div className="alert alert--danger">{error}</div> : null}
          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? "Registering..." : "Capture & Register"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default RegisterStudentPage;
