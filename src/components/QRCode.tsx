'use client';

import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCode({ value, size = 150, className = '' }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    QRCodeLib.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setDataUrl).catch(console.error);
  }, [value, size]);

  if (!dataUrl) return null;

  return (
    <img
      src={dataUrl}
      alt={`QR: ${value}`}
      width={size}
      height={size}
      className={className}
    />
  );
}
