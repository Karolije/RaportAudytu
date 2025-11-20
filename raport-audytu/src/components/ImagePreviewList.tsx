import React from 'react';

type Props = {
  images?: string[];
  onRemove?: (index: number) => void; // callback do usuwania
};

export const ImagePreviewList: React.FC<Props> = ({ images, onRemove }) => {
  if (!images || images.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 5 }}>
      {images.map((url, index) => (
        <div
          key={index}
          style={{
            position: 'relative',
            width: 80,
            height: 80,
          }}
        >
          <img
            src={url}
            alt={`preview-${index}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 5 }}
          />
          {onRemove && (
            <button
              onClick={() => {
                if (window.confirm("Czy na pewno chcesz usunąć to zdjęcie?")) {
                  onRemove(index);
                }
              }}
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 18,
                height: 18,
                cursor: 'pointer',
                fontSize: 12,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
