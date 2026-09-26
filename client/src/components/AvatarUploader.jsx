import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  // Task 3: Local preview cleanup
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  // Task 2: Client-side validation
  function validate(selectedFile) {
    if (!ALLOWED.includes(selectedFile.type)) {
      return "Only image files are allowed (JPEG, PNG, WebP, GIF)";
    }
    if (selectedFile.size > MAX_SIZE) {
      return "File is too large (max 5MB)";
    }
    return null;
  }

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return;

    const validationError = validate(selectedFile);
    setProgress(0);
    setUploadedUrl(null);

    if (validationError) {
      setFile(null);
      setPreview(null);
      setError(validationError);
      return;
    }

    setError(null);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  // Task 1: Drag-and-drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  // Task 4: Axios upload with progress
  async function upload() {
    if (!file) return;

    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setError(null);
    setProgress(0);
    setIsUploading(true);

    try {
      const res = await apiClient.post("/api/upload", formData, {
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        },
      });
      setProgress(100);
      setUploadedUrl(res.data.url);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <div
        className={isDragging ? "drop-zone dragging" : "drop-zone"}
        onClick={() => inputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>{isDragging ? "Drop to upload" : "Drag an image here, or click to choose"}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            handleFileSelect(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="error">{error}</p>}

      {preview && (
        <div style={{ marginTop: "1rem" }}>
          <img src={preview} alt="Selected preview" className="preview" />
        </div>
      )}

      {progress > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <p style={{ margin: "0.5rem 0", fontSize: "0.875rem", color: "#64748b" }}>
            {isUploading ? `Uploading: ${progress}%` : `Uploaded: ${progress}%`}
          </p>
          <div className="bar">
            <div className="fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {uploadedUrl && (
        <p style={{ color: "#16a34a", fontSize: "0.875rem", marginTop: "0.75rem" }}>
          Uploaded successfully!{" "}
          <a href={uploadedUrl} target="_blank" rel="noreferrer">
            {uploadedUrl}
          </a>
        </p>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button onClick={upload} disabled={!file || isUploading}>
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
