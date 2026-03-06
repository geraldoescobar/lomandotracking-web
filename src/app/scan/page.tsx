'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { extractCodeFromQR } from '@/lib/qr-url';

export default function ScanPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const qrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (qrRef.current?.isScanning) {
        qrRef.current.stop();
      }
    };
  }, []);

  function navigateToSeguimiento(scannedCode: string) {
    if (scannedCode) {
      router.push(`/seguimiento?code=${scannedCode}`);
    }
  }

  async function startScan() {
    setScanError('');
    try {
      const qr = new Html5Qrcode('qr-reader');
      qrRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          qr.stop();
          setScanning(false);
          const extracted = extractCodeFromQR(decodedText);
          setCode(extracted);
          navigateToSeguimiento(extracted);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setScanError('Error al iniciar camara. Verifica permisos.');
      console.error(err);
    }
  }

  async function stopScan() {
    if (qrRef.current?.isScanning) {
      await qrRef.current.stop();
    }
    setScanning(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigateToSeguimiento(code.trim().toUpperCase());
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Escanear QR</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div id="qr-reader" className="w-full rounded-lg overflow-hidden mb-3"></div>

        {scanError && (
          <p className="text-red-500 text-sm mb-2">{scanError}</p>
        )}

        {scanning ? (
          <button
            onClick={stopScan}
            className="w-full bg-red-500 text-white py-3 rounded-xl font-medium"
          >
            Detener camara
          </button>
        ) : (
          <button
            onClick={startScan}
            className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 shadow-md"
          >
            Escanear QR
          </button>
        )}
      </div>

      <div className="text-center text-gray-400 text-sm mb-4">-- o ingresar manualmente --</div>

      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Codigo de orden o paquete"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-mono"
        />
        <button
          type="submit"
          disabled={!code.trim()}
          className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
