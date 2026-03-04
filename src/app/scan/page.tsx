'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const qrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (qrRef.current?.isScanning) {
        qrRef.current.stop();
      }
    };
  }, []);

  async function startScan() {
    setError(null);
    try {
      const qr = new Html5Qrcode('qr-reader');
      qrRef.current = qr;
      
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          qr.stop();
          router.push(`/orders/${decodedText}`);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setError('Error al iniciar la cámara. Verifica los permisos.');
      console.error(err);
    }
  }

  async function stopScan() {
    if (qrRef.current?.isScanning) {
      await qrRef.current.stop();
    }
    setScanning(false);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) {
      router.push(`/orders/${manualCode.trim()}`);
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 relative">
          <Image 
            src="/driverIcon.png" 
            alt="Driver" 
            fill
            className="object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-gray-800">Escanear QR</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
        
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
        
        {scanning ? (
          <button
            onClick={stopScan}
            className="w-full mt-4 bg-red-500 text-white py-3 rounded-xl font-medium"
          >
            Detener
          </button>
        ) : (
          <button
            onClick={startScan}
            className="w-full mt-4 bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 shadow-md"
          >
            Iniciar Cámara
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-medium mb-3 text-gray-700">Ingresar código manualmente</h2>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Código del pedido"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            className="bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600"
          >
            Buscar
          </button>
        </form>
      </div>
    </div>
  );
}
