import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rotate3d } from 'lucide-react';
import SearchInterface from './SearchInterface';
import useTextGen from '../../hooks/useTextGen';
import { useImageGen } from '../../hooks/useImageGen';
import { authUtils } from '../../utils/auth';

const ModelGenerator = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [showDrawing, setShowDrawing] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  // Text generation hook
  const {
    generateModel: generateFromText,
    isLoading: isTextLoading,
    taskStatus: textTaskStatus,
    setErrorMessage
  } = useTextGen();

  // Image generation hook - properly pass the setter functions
  const { 
    handleImageReady: handleGenerateFromImage, 
    taskStatus: imageTaskStatus 
  } = useImageGen(setShowDrawing, setIsImageLoading, setError);

  const isGenerating = isTextLoading || isImageLoading;
  const generationType = isTextLoading ? 'text' : 'image';
  const currentTaskStatus = isTextLoading ? textTaskStatus : imageTaskStatus;
  const progress = currentTaskStatus?.progress;

  const handleAuthentication = () => {
    if (!authUtils.isAuthenticated()) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleSearch = (query) => {
    if (handleAuthentication()) {
      generateFromText(query).catch(err => setErrorMessage(err.message));
    }
  };

  const handleImageReady = (imageData) => {
    if (handleAuthentication()) {
      handleGenerateFromImage(imageData).catch(err => setError(err.message));
    }
  };

  const handleRandom = () => {
    if (handleAuthentication()) {
      const randomPrompts = [
        'A cute robot companion with friendly features',
        'An ancient magical crystal formation',
        'A steampunk pocket watch with intricate gears',
        'A mystical floating island with waterfalls',
        'A futuristic hover vehicle with neon accents',
      ];
      const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
      generateFromText(randomPrompt).catch(err => setErrorMessage(err.message));
    }
  };

  return (
    <>
      <SearchInterface 
        onSearch={handleSearch} 
        onRandom={handleRandom}
        onImageReady={handleImageReady}
        showDrawing={showDrawing}
        setShowDrawing={setShowDrawing}
      />

      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="animate-spin mb-4">
              <Rotate3d className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-white text-center">
              {generationType === 'text' ? 'Generating your 3D model...' : 'Converting your image to 3D...'}
              {progress !== undefined && ` (${progress}%)`}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
};

export default ModelGenerator;