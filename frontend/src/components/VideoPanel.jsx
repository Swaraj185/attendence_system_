function VideoPanel({ videoRef, canvasRef, title, mirrored = true }) {
  return (
    <section className="panel video-panel">
      <div className="panel__header">
        <h3>{title}</h3>
      </div>
      <div className="video-frame">
        <video ref={videoRef} autoPlay playsInline muted className={mirrored ? "mirrored" : ""} />
        <canvas ref={canvasRef} className="hidden-canvas" />
      </div>
    </section>
  );
}

export default VideoPanel;
