import React from "react";

interface ImagePreviewListProps {
  images?: string[]; // tablica stringów lub undefined
}

export const ImagePreviewList: React.FC<ImagePreviewListProps> = ({ images }) => {
  if (!images?.length) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginTop: 5,
        flexWrap: "wrap",
      }}
    >
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`img-${idx}`}
          style={{
            width: 80,
            height: 80,
            objectFit: "cover",
            border: "1px solid #ccc",
          }}
        />
      ))}
    </div>
  );
};
