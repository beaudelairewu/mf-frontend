// src/components/ModelEditor.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Share2, Rotate3d, Maximize2, Minimize2 } from 'lucide-react';
import { Card } from './Card';
import { SceneSetup } from '../utils/sceneSetup';
import { ModelLoaderColored } from '../utils/modelLoaderColored';
import { ModelLoader } from '../utils/modelLoader';
import { useNavigate } from 'react-router-dom';
import logo from '../images/modelflow.png';

const ModelEditorPage = ({ modelUrl, modelDetails, textureTaskId, taskId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const containerRef = useRef(null);
  const sceneSetupRef = useRef(null);
  const navigate = useNavigate();

  // if(!taskId) taskId = "0193909c-a2d9-739b-8854-da78f31e699f";

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize scene
    sceneSetupRef.current = new SceneSetup(containerRef.current);
    sceneSetupRef.current.init();

    return () => {
      if (sceneSetupRef.current) {
        sceneSetupRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      if (!sceneSetupRef.current || !taskId){
        console.log('Task ID is required');
        return;
      }
      setIsLoading(true);
      setLoadError(null);
      
      try {
        // Wait for texture task to complete if it exists
        // if (textureTaskId) {
        //   let textureStatus;
        //   do {
        //     const response = await fetch(`/api/text-to-texture/${textureTaskId}`);
        //     textureStatus = await response.json();
        //     if (textureStatus.status === 'FAILED') {
        //       throw new Error('Texture generation failed');
        //     }
        //     await new Promise(resolve => setTimeout(resolve, 2000));
        //   } while (textureStatus.status !== 'SUCCEEDED');
        // }

        // Load model with textures
        const result = await ModelLoader.loadModel(taskId);
        ModelLoader.setupModelInScene(result, sceneSetupRef.current.scene);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading model:', error);
        setLoadError(error.message);
        setIsLoading(false);
      }
    };

    loadModel();
  }, [taskId, textureTaskId]);

  const handleDownload = () => {
    if (modelUrl) {
      window.open(modelUrl, '_blank');
    }
  };

  const handleShare = () => {
    if (modelUrl) {
      navigator.clipboard.writeText(modelUrl)
        .then(() => alert('Model URL copied to clipboard!'))
        .catch(err => console.error('Failed to copy URL:', err));
    }
  };

  const handleBack = () => {
    navigate('/', { replace: true });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (sceneSetupRef.current) {
        sceneSetupRef.current.handleResize();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#1a1d21] text-white">
      <header className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <img src={logo} alt="Modelflow Logo" className="h-10" />
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="px-4 py-2 flex items-center gap-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
            <button 
              onClick={handleDownload}
              className="px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className={`grid gap-6 ${isFullscreen ? '' : 'grid-cols-1 lg:grid-cols-4'}`}>
          <Card className={`relative ${isFullscreen ? 'h-[80vh]' : 'lg:col-span-3 aspect-[4/3]'} bg-gray-800 rounded-lg`}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin">
                  <Rotate3d className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            )}
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-red-500 text-center p-4">
                  <p className="font-bold">Error Loading Model</p>
                  <p>{loadError}</p>
                </div>
              </div>
            )}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 p-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            <div ref={containerRef} className="w-full h-full" />
          </Card>
          
          {!isFullscreen && (
            <Card className="p-4 bg-gray-800 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Model Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <p className="text-white">{modelDetails?.name || 'Untitled Model'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Format</label>
                  <p className="text-white">{modelDetails?.format || 'GLB'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Size</label>
                  <p className="text-white">{modelDetails?.size || 'Unknown'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Created</label>
                  <p className="text-white">{modelDetails?.created || 'Unknown'}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ModelEditorPage;