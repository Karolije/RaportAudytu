import React from 'react';

type Props = {
  images?: string[];
};

export const ImagePreviewList: React.FC<Props> = ({ images }) => {
  if (!images || images.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 5 }}>
      {images.map((url, index) => (
        <img
          key={index}
          src={url}
          alt={`preview-${index}`}
          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 5 }}
        />
      ))}
    </div>
  );
};
