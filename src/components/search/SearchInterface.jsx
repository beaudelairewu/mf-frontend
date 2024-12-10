import React, { useState } from 'react';
import { SearchIcon, Package, Pencil, AlertCircle } from 'lucide-react';
import { BackgroundGrid } from './BackgroundGrid';
import { useImageGen } from '../../hooks/useImageGen';
import useTypingEffect from '../../hooks/useTypingEffect';
import logo from '../../images/modelflow.png';
import DrawingCanvas from './CanvasDrawing';

const ModelflowInterface = ({ onSearch, onRandom }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleImageReady } = useImageGen(
    setShowDrawing,
    setIsLoading,
    setError
  );
  const displayText = useTypingEffect();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), e);
    }
  };

  const handleRandomClick = (e) => {
    e.preventDefault();

    onRandom(e);
  };

  return (
    <div className="min-h-screen bg-[#1a1d21] relative overflow-hidden">
      <BackgroundGrid />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Logo section */}
          <div className="mb-12 flex items-center gap-4">
            <img src={logo} alt="Modelflow Logo" className="w-24 h-22" />
            <div className="flex flex-col -space-y-1">
              <h1 className="text-white text-7xl font-bold tracking-wide leading-none">MODELFLOW</h1>
              <p className="text-gray-400 text-lg">Where ideas become reality.</p>
            </div>
          </div>
          
          {/* Search form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-4 w-full max-w-2xl">
            <div className="relative flex-grow">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={displayText}
                className="w-full bg-gray-700/50 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:ring-0 transition-all pr-12"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-600/50 rounded-full transition-colors"
              >
                <SearchIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            {/* Draw button */}
            <button
              type="button"
              onClick={() => setShowDrawing(true)}
              className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition-colors"
              title="Draw your object"
            >
              <Pencil className="w-6 h-6 text-gray-400" />
            </button>
            
            {/* Random button */}
            <div className="relative">
              <button 
                type="button"
                onClick={handleRandomClick}
                className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-600/50 transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <Package className="w-6 h-6 text-gray-400" />
              </button>
              
              {showTooltip && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm py-1 px-2 rounded whitespace-nowrap">
                  I'm feeling lucky
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg text-white text-center">
            <div className="animate-spin mb-4">
              <Package className="w-8 h-8 text-blue-500" />
            </div>
            <p>Converting your image to 3D...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Drawing Canvas Modal */}
      {showDrawing && (
        <DrawingCanvas 
          onClose={() => setShowDrawing(false)}
          onImageReady={handleImageReady}
        />
      )}
    </div>
  );
};

export default ModelflowInterface;