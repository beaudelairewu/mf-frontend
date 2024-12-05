// src/components/ModelDebugTest.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ModelLoader } from '../utils/modelLoader';
import { SceneSetup } from '../utils/sceneSetup';
import { Rotate3d } from 'lucide-react';
import { ModelLoaderColored } from '../utils/modelLoaderColored';

const TEST_TASK_ID = "01938bbc-e363-717b-92e3-8648310784d5"; // Your test task ID

const ModelDebugTest = () => {
  const containerRef = useRef(null);
  const sceneSetupRef = useRef(null);
  const [debugLog, setDebugLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message) => {
    setDebugLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    if (containerRef.current) {
      sceneSetupRef.current = new SceneSetup(containerRef.current);
      sceneSetupRef.current.init();
    }

    return () => {
      if (sceneSetupRef.current) {
        sceneSetupRef.current.dispose();
      }
    };
  }, []);

  const loadModel = async () => {
    if (!sceneSetupRef.current) return;

    setIsLoading(true);
    addLog('Starting model load process...');
    
    try {
      addLog('Loading model through proxy server...');
      const gltf = await ModelLoaderColored.loadModel(TEST_TASK_ID);
      
      addLog('Setting up model in scene...');
      ModelLoaderColored.setupModelInScene(gltf, sceneSetupRef.current.scene);
      addLog('Model loaded and set up successfully!');
      
    } catch (error) {
      addLog(`Error: ${error.message}`);
      console.error('Detailed error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Model Loading Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4 space-x-4">
              <button
                onClick={loadModel}
                disabled={isLoading}
                className={`px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-2 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <Rotate3d className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load Model'
                )}
              </button>
            </div>
            
            <div className="h-[600px] bg-gray-800 rounded-lg" ref={containerRef} />
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Debug Log</h2>
            <div className="space-y-1 font-mono text-sm h-[600px] overflow-y-auto">
              {debugLog.map((log, index) => (
                <div key={index} className="border-b border-gray-700 pb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelDebugTest;