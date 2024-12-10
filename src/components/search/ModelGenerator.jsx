import React, { useState, useEffect } from 'react';
import { Rotate3d } from 'lucide-react';
import SearchInterface from './SearchInterface';
import useTextGen from '../../hooks/useTextGen';
const ModelGenerator = () => {

  const {
    generateModel,
    isLoading,
    taskStatus,
    errorMessage,
    setErrorMessage
  } = useTextGen();

  const handleRandom = () => {
    const randomPrompts = [
      'A cute robot companion with friendly features',
      'An ancient magical crystal formation',
      'A steampunk pocket watch with intricate gears',
      'A mystical floating island with waterfalls',
      'A futuristic hover vehicle with neon accents',
    ];
    const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
    generateModel(randomPrompt);
  };

  return (
    <>
      <SearchInterface onSearch={generateModel} onRandom={handleRandom} />

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="animate-spin mb-4">
              <Rotate3d className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-white text-center">
              Generating your 3D model...
              {taskStatus?.progress !== undefined && ` (${taskStatus.progress}%)`}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg">
          <p className="font-semibold">Error</p>
          <p>{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
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