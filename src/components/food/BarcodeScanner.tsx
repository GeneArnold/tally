'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Flashlight, FlashlightOff } from 'lucide-react';

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [torch, setTorch] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(true);

  useEffect(() => {
    let reader: import('@zxing/library').BrowserMultiFormatReader | null = null;

    async function startScanner() {
      try {
        // Request camera permission first — browsers won't enumerate devices without it
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        // Store stream for torch control
        streamRef.current = stream;

        const { BrowserMultiFormatReader } = await import('@zxing/library');
        reader = new BrowserMultiFormatReader();

        // Now enumerate devices (labels available after permission grant)
        const devices = await reader.listVideoInputDevices();
        const backCamera = devices.find(
          (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'),
        );
        const deviceId = backCamera?.deviceId || devices[0]?.deviceId;

        // Stop the permission stream — decodeFromVideoDevice will create its own
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (!deviceId && devices.length === 0) {
          setError('No camera found on this device.');
          return;
        }

        reader.decodeFromVideoDevice(deviceId || null, videoRef.current!, (result, err) => {
          if (result && scanningRef.current) {
            scanningRef.current = false;
            const code = result.getText();
            onScan(code);
          }
          if (err && err.name !== 'NotFoundException') {
            console.error('Scan error:', err);
          }
        });

        // Get the new stream for torch control
        await new Promise((r) => setTimeout(r, 500));
        if (videoRef.current?.srcObject) {
          streamRef.current = videoRef.current.srcObject as MediaStream;
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access in your browser settings.');
        } else {
          setError('Could not start camera. Try the manual barcode entry instead.');
        }
      }
    }

    startScanner();

    return () => {
      scanningRef.current = false;
      if (reader) {
        reader.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onScan]);

  async function toggleTorch() {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const newTorch = !torch;
      await track.applyConstraints({
        advanced: [{ torch: newTorch } as MediaTrackConstraintSet],
      });
      setTorch(newTorch);
    } catch {
      // Torch not supported on this device
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-10">
        <button onClick={onClose} className="text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={24} />
        </button>
        <p className="text-white font-medium">Scan Barcode</p>
        <button onClick={toggleTorch} className="text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
          {torch ? <FlashlightOff size={22} /> : <Flashlight size={22} />}
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          autoPlay
          muted
        />

        {/* Scan guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-72 h-40 border-2 border-white/60 rounded-xl relative">
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />

            {/* Scanning line animation */}
            <div className="absolute left-2 right-2 h-0.5 bg-red-500/80 animate-pulse top-1/2" />
          </div>
        </div>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-8">
            <div className="bg-white rounded-2xl p-6 text-center max-w-sm">
              <p className="text-gray-900 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 bg-blue-600 text-white rounded-lg px-6 py-3 font-medium active:bg-blue-800"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="bg-black/80 px-4 py-4 text-center">
        <p className="text-white/70 text-sm">Point camera at a barcode</p>
      </div>
    </div>
  );
}
