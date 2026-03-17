import { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      }
    } catch (err) {
      setError('Camera access denied. You can upload a photo instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCaptured(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const resizeImage = (dataUrl, maxDim = 1200) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxDim && img.height <= maxDim) {
          resolve(dataUrl);
          return;
        }
        const scale = maxDim / Math.max(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const resized = await resizeImage(ev.target.result);
      setCaptured(resized);
    };
    reader.readAsDataURL(file);
  };

  const handleUse = () => {
    onCapture(captured);
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Scan Wine Label</h3>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-1 hover:bg-stone-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              {error}
            </div>
          )}

          {!captured && !streaming && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center">
                <Camera size={40} className="text-stone-400" />
              </div>
              <p className="text-stone-500 text-sm text-center">
                Take a photo of the wine label or upload an image
              </p>
              <div className="flex gap-3">
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 bg-burgundy text-white rounded-lg font-medium hover:bg-burgundy/90 flex items-center gap-2"
                >
                  <Camera size={18} /> Open Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 flex items-center gap-2"
                >
                  <Upload size={18} /> Upload Photo
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {streaming && !captured && (
            <div className="relative">
              <video ref={videoRef} className="w-full rounded-lg" autoPlay playsInline />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  onClick={takePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-burgundy shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
                >
                  <div className="w-12 h-12 bg-burgundy rounded-full" />
                </button>
              </div>
            </div>
          )}

          {captured && (
            <div className="space-y-4">
              <img src={captured} alt="Captured wine label" className="w-full max-h-[60vh] object-contain rounded-lg bg-stone-100" />
              <div className="flex gap-3">
                <button
                  onClick={handleRetake}
                  className="flex-1 py-2.5 border border-stone-300 rounded-lg font-medium hover:bg-stone-50 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> Retake
                </button>
                <button
                  onClick={handleUse}
                  className="flex-1 py-2.5 bg-burgundy text-white rounded-lg font-medium hover:bg-burgundy/90"
                >
                  Use This Photo
                </button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
