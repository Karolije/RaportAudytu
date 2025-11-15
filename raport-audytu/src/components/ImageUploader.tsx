import React from "react";

interface ImageUploaderProps {
  onUpload: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(Array.from(e.target.files)); // konwertujemy FileList na tablicę
    }
  };

  return (
    <label
      style={{
        display: "inline-block",
        padding: "6px 12px",
        backgroundColor: "#1976d2",
        color: "white",
        borderRadius: 5,
        cursor: "pointer",
      }}
    >
      Dodaj pliki
      <input
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleChange}
      />
    </label>
  );
};
