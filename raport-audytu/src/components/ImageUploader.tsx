import React, { ChangeEvent } from 'react';

type Props = {
  onUpload: (files: FileList) => void;
};

export const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = ''; // reset
    }
  };

  return (
    <input
  type="file"
  accept="image/*"
  capture="environment"  // użyj "user" dla przedniej kamery, "environment" dla tylnej
  multiple
  onChange={handleChange}
/>
  );
};
