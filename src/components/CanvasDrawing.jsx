import React, { useRef, useState, useEffect } from 'react';
import { ImageDown, X, Eraser, Undo, Upload, Paintbrush, Image as ImageIcon, Download } from 'lucide-react';

const DrawingCanvas = ({ onClose, onImageReady }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [strokeStyle, setStrokeStyle] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [mode, setMode] = useState('draw'); // 'draw' or 'upload'
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      const maxWidth = Math.min(containerRef.current.offsetWidth - 32, 800);
      const width = maxWidth;
      const height = Math.round(width * 0.75);
      setDimensions({ width, height });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    const context = canvas.getContext('2d');
    context.lineCap = "round";
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    contextRef.current = context;
    
    // Set white background
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // If there's an uploaded image, draw it
    if (uploadedImage) {
      drawUploadedImage();
    } else {
      saveState();
    }
  }, [dimensions, uploadedImage]);
  const saveState = () => {
    const canvas = canvasRef.current;
    setHistory(prev => [...prev, canvas.toDataURL()]);
  };
  const undo = () => {
    if (history.length <= 1) return;
    
    const previousState = history[history.length - 2];
    const img = new Image();
    img.src = previousState;
    img.onload = () => {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      contextRef.current.drawImage(img, 0, 0);
      setHistory(prev => prev.slice(0, -1));
    };
  };

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    saveState();
  };
  const downloadImage = () => {
    const canvas = canvasRef.current;
    
    // Create a download link
    const link = document.createElement('a');
    link.download = `modelflow-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const drawUploadedImage = () => {
    if (!uploadedImage || !contextRef.current) return;
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const img = new Image();
    img.src = uploadedImage;
    
    img.onload = () => {
      // Clear canvas
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate aspect ratios
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;
      
      // Fit image while maintaining aspect ratio
      if (imgRatio > canvasRatio) {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }
      
      context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      saveState();
    };
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      setMode('upload');
    };
    reader.readAsDataURL(file);
  };

  // ... keep existing drawing functions (saveState, undo, startDrawing, draw, stopDrawing) ...

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setUploadedImage(null);
    setMode('draw');
    saveState();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    // Create a temporary canvas for resizing to 512x384 (4:3)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 512;
    tempCanvas.height = 384;
    const tempContext = tempCanvas.getContext('2d');
    tempContext.drawImage(canvas, 0, 0, 512, 384);
    
    const imageData = tempCanvas.toDataURL('image/png');
    onImageReady(imageData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-4 rounded-lg max-w-full max-h-[90vh] overflow-y-auto" ref={containerRef}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Create Your Image (4:3)</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('draw')}
              className={`p-2 rounded flex items-center gap-2 ${
                mode === 'draw' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Paintbrush className="w-4 h-4" />
              Draw
            </button>
            <button
              onClick={() => {
                setMode('upload');
                fileInputRef.current?.click();
              }}
              className={`p-2 rounded flex items-center gap-2 ${
                mode === 'upload' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Drawing Controls */}
          {mode === 'draw' && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={clearCanvas}
                className="p-2 bg-gray-700 rounded hover:bg-gray-600 text-white flex items-center gap-2"
              >
                <Eraser className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={undo}
                disabled={history.length <= 1}
                className="p-2 bg-gray-700 rounded hover:bg-gray-600 text-white flex items-center gap-2 disabled:opacity-50"
              >
                <Undo className="w-4 h-4" />
                Undo
              </button>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={strokeStyle}
                  onChange={(e) => {
                    setStrokeStyle(e.target.value);
                    contextRef.current.strokeStyle = e.target.value;
                  }}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={lineWidth}
                  onChange={(e) => {
                    setLineWidth(e.target.value);
                    contextRef.current.lineWidth = e.target.value;
                  }}
                  className="w-32"
                />
                <span className="text-white text-sm">
                  {lineWidth}px
                </span>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className="bg-white rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={mode === 'draw' ? startDrawing : undefined}
              onMouseMove={mode === 'draw' ? draw : undefined}
              onMouseUp={mode === 'draw' ? stopDrawing : undefined}
              onMouseLeave={mode === 'draw' ? stopDrawing : undefined}
              className={mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}
              style={{ 
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                touchAction: 'none'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {mode === 'upload' && !uploadedImage && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600 text-white flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Choose Image
              </button>
            )}
            <button
              onClick={downloadImage}
              className="flex-1 p-2 bg-gray-700 rounded hover:bg-gray-600 text-white flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Save to Device
            </button>
            <button
              onClick={handleSave}
              className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              <ImageDown className="w-4 h-4" />
              Use Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;