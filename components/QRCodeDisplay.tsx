// components/QRCodeDisplay.tsx

import React from 'react';
import QRCode from 'react-native-qrcode-svg'; // Import the actual QR code component

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  foregroundColor?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  value, 
  size = 200, 
  backgroundColor = '#FFFFFF', // Default to white background
  foregroundColor = '#000000'  // Default to black foreground
}) => {
  // If no value is provided, we can return null or a placeholder
  if (!value) {
    return null; 
  }

  // Render the actual QR code from the library
  return (
    <QRCode
      value={value}
      size={size}
      backgroundColor={backgroundColor}
      color={foregroundColor} // The library uses 'color' for the foreground
    />
  );
};

export default QRCodeDisplay;