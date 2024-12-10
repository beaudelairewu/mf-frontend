import React, { useState, useEffect, useRef } from 'react';
import { Download, Rotate3d, Maximize2, Minimize2, Upload } from 'lucide-react';
import { Card } from './common_ui/Card';
import { SceneSetup } from '../utils/sceneSetup';
import { ModelLoader } from '../utils/modelLoader';
import { useTextureGen } from '../hooks/useTextureGen';
import logo from '../images/modelflow.png';

const ModelEditorPage = ({ modelUrl, modelDetails, textureTaskId, taskId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [showTextureForm, setShowTextureForm] = useState(false);
  const [objectPrompt, setObjectPrompt] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [shouldGenerateTexture, setShouldGenerateTexture] = useState(false);
  
  const containerRef = useRef(null);
  const sceneSetupRef = useRef(null);
  const modelRef = useRef(null);

  const {
    generateTexture,
    isLoading: isGeneratingTexture,
    taskStatus: textureStatus,
    errorMessage: textureError,
    setErrorMessage: setTextureError
  } = useTextureGen();

  useEffect(() => {
    if (!containerRef.current) return;
    sceneSetupRef.current = new SceneSetup(containerRef.current);
    sceneSetupRef.current.init();
    console.log("modelUrl", modelUrl)
    return () => sceneSetupRef.current?.dispose();
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      if (!sceneSetupRef.current || !taskId) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await ModelLoader.loadModel(taskId);
        modelRef.current = ModelLoader.setupModelInScene(result, sceneSetupRef.current.scene);
        setIsLoading(false);
      } catch (error) {
        setLoadError(error.message);
        setIsLoading(false);
      }
    };
    loadModel();
  }, [taskId]);

  // Separate effect for texture generation
  useEffect(() => {
    const handleTextureGeneration = async () => {
      if (!shouldGenerateTexture || !modelUrl || !objectPrompt || !stylePrompt) return;
      
      try {
        console.log('Model URL:', modelUrl); // Add this line

        await generateTexture(modelUrl, objectPrompt, stylePrompt);
      } catch (error) {
        setTextureError(error.message);
      } finally {
        setShouldGenerateTexture(false);
        setObjectPrompt('');
        setStylePrompt('');
      }
    };

    handleTextureGeneration();
  }, [shouldGenerateTexture, modelUrl, objectPrompt, stylePrompt, generateTexture]);

  const handleTextureGenerate = () => {
    if (!modelUrl || !objectPrompt || !stylePrompt) return;
    setShowTextureForm(false);
    setShouldGenerateTexture(true);
  };

  const handleCancelTexture = () => {
    setShowTextureForm(false);
    setObjectPrompt('');
    setStylePrompt('');
    setTextureError(null);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => sceneSetupRef.current?.handleResize(), 100);
  };

  return (
    <div className="min-h-screen bg-[#1a1d21] text-white">
      <header className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Modelflow Logo" className="h-10" />
            <h1 className="font-helvetica font-bold">MODELFLOW</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowTextureForm(true);
                setTextureError(null);
              }}
              className="px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              disabled={isGeneratingTexture}
            >
              <Upload className="w-5 h-5" />
              Add Texture
            </button>
            {modelUrl && (
              <button
                onClick={() => window.open(modelUrl, '_blank')}
                className="px-4 py-2 flex items-center gap-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            )}
          </div>
        </div>
      </header>

      {isGeneratingTexture && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-700">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ 
              width: `${textureStatus?.progress || 0}%`
            }}
          />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className={`grid gap-6 ${isFullscreen ? '' : 'grid-cols-1 lg:grid-cols-4'}`}>
          <Card className={`relative ${isFullscreen ? 'h-[80vh]' : 'lg:col-span-3 aspect-[4/3]'} bg-gray-800 rounded-lg`}>
            {(isLoading || isGeneratingTexture) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin">
                  <Rotate3d className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            )}
            {(loadError || textureError) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-red-500 text-center p-4">
                  <p className="font-bold">Error</p>
                  <p>{loadError || textureError}</p>
                </div>
              </div>
            )}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 p-2 bg-gray-700/50 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
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

      {showTextureForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-gray-800">
            <h3 className="text-lg font-semibold mb-4">Generate Texture</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Object Description</label>
                <input
                  type="text"
                  value={objectPrompt}
                  onChange={(e) => setObjectPrompt(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                  placeholder="e.g., rustic wooden table"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Style Description</label>
                <input
                  type="text"
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                  placeholder="e.g., weathered oak with dark grain"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelTexture}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTextureGenerate}
                  disabled={!objectPrompt || !stylePrompt || isGeneratingTexture}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModelEditorPage;