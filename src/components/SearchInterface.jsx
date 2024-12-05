// ModelflowInterface.jsx
import React, { useState, useEffect } from 'react';
import { SearchIcon, Package } from 'lucide-react';
import logo from '../images/modelflow.png';

const searchPhrases = [
  "A teddy bear wearing santa hat...",
  "A cyberpunk city at night...",
  "A magical forest with fairies...",
  "An astronaut on Mars...",
  "A steampunk watch mechanism..."
];

const ModelflowInterface = ({ onSearch, onRandom }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  // ... keep existing useEffect for typing animation ...
  useEffect(() => {
    if (isTyping) {
      if (displayText.length < searchPhrases[currentPhraseIndex].length) {
        const timeout = setTimeout(() => {
          setDisplayText(searchPhrases[currentPhraseIndex].slice(0, displayText.length + 1));
        }, 100);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsTyping(false), 7000);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        setCurrentPhraseIndex((prev) => (prev + 1) % searchPhrases.length);
        setIsTyping(true);
      }
    }
  }, [displayText, currentPhraseIndex, isTyping]);


  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchQuery || displayText);
  };

  return (
    <div className="min-h-screen bg-[#1a1d21] relative overflow-hidden">
      {/* Container for 3D Grid Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-[300vw] h-[200vh]"
          style={{
            backgroundColor: '#1a1d21',
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            transform: 'perspective(1000px) rotateX(60deg) scale(0.9)',
            transformOrigin: 'center center',
            backgroundPosition: 'center center',
            left: '-100vw',
            top: '-70vh'
          }}
        />
      </div>

      {/* Content container - centered absolutely */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Logo section */}
          <div className="mb-12 flex items-center gap-4">
            {/* Logo placeholder */}
              <img 
                src={logo} 
                alt="Modelflow Logo" 
                className="w-24 h-22"
              />
            
            {/* Logo text and tagline with reduced spacing */}
            <div className="flex flex-col -space-y-1">
              <h1 className="text-white text-7xl font-bold tracking-wide leading-none">MODELFLOW</h1>
              <p className="text-gray-400 text-lg">Where ideas become reality.</p>
            </div>
          </div>
          
          {/* Updated search form */}
          <form onSubmit={handleSearch} className="flex items-center gap-4 w-full max-w-2xl">
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
            
            <div className="relative">
              <button 
                type="button"
                onClick={onRandom}
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
    </div>
  );
};

export default ModelflowInterface;