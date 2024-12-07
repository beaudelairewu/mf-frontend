import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Share2, Rotate3d, Maximize2, Minimize2, Paintbrush } from 'lucide-react';
import { Card } from './Card';
import { SceneSetup } from '../utils/sceneSetup';
import { ModelLoader } from '../utils/modelLoader';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import logo from '../images/modelflow.png';
import { texture } from 'three/webgpu';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const LoadingOverlay = ({ message }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
    <div className="text-center">
      <div className="animate-spin mb-4">
        <Rotate3d className="w-8 h-8 text-blue-500" />
      </div>
      <p className="text-white">{message}</p>
    </div>
  </div>
);

const ErrorOverlay = ({ message }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-red-500 text-center p-4">
      <p className="font-bold">Error Loading Model</p>
      <p>{message}</p>
    </div>
  </div>
);

const DetailsCard = ({ modelDetails, textureStatus, isFullscreen }) => {
  if (isFullscreen) return null;
  
  return (
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
        {textureStatus && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Textures</label>
            <p className="text-white">
              {textureStatus.status === 'SUCCEEDED' ? 'Applied' :
               textureStatus.status === 'IN_PROGRESS' ? `Generating... ${textureStatus.progress}%` :
               textureStatus.status === 'FAILED' ? 'Generation failed' :
               'Pending'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

const ModelEditorPage = ({ modelUrl, modelDetails, textureTaskId, taskId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [textureStatus, setTextureStatus] = useState(null);
  const [isApplyingTexture, setIsApplyingTexture] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const containerRef = useRef(null);
  const sceneSetupRef = useRef(null);
  const modelRef = useRef(null);
  const navigate = useNavigate();
textureTaskId = "019398a2-20f9-7bd8-a429-044fbedc4630"
  const addDebugLog = (message) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Initialize the 3D scene
  useEffect(() => {
    if (containerRef.current) {
      addDebugLog('Initializing 3D scene');
      sceneSetupRef.current = new SceneSetup(containerRef.current);
      sceneSetupRef.current.init();
    }
    return () => {
      addDebugLog('Disposing 3D scene');
      sceneSetupRef.current?.dispose();
    };
  }, []);

  // Load the model into the scene
  useEffect(() => {
    const loadModel = async () => {
      if (!sceneSetupRef.current || !taskId) return;
      setIsLoading(true);
      setLoadError(null);

      try {
        addDebugLog(`Loading model for task: ${taskId}`);
        const result = await ModelLoader.loadModel(taskId);
        modelRef.current = ModelLoader.setupModelInScene(result, sceneSetupRef.current.scene);
        addDebugLog('Model loaded successfully');
      } catch (error) {
        addDebugLog(`Error loading model: ${error.message}`);
        console.error('Error loading model:', error);
        setLoadError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadModel();
  }, [taskId]);

  // Monitor texture task
  useEffect(() => {
    let intervalId;
    let mounted = true;
    console.log("textureTaskId: ",textureTaskId)

    const checkTextureStatus = async () => {
      if (!textureTaskId) {
        addDebugLog('No texture task ID available');
        return;
      }

      try {
        console.log("check")
        addDebugLog(`Checking texture status for task: ${textureTaskId}`);
        const response = await fetch(`${API_BASE_URL}/api/text-to-texture/${textureTaskId}`);
        // console.l
        if (!response.ok) {
          throw new Error(`Texture status check failed: ${response.status}`);
        }

        const data = await response.json();
        addDebugLog(`Texture status: ${data.status}, Progress: ${data.progress}%`);
        
        if (!mounted) return;
        setTextureStatus(data);

        if (data.status === 'SUCCEEDED') {
          clearInterval(intervalId);
          addDebugLog('Texture generation succeeded, starting application...');
          await applyTexturesToModel(data);
        } else if (data.status === 'FAILED') {
          clearInterval(intervalId);
          const errorMessage = data.task_error?.message || 'Unknown error';
          addDebugLog(`Texture generation failed: ${errorMessage}`);
          setLoadError(`Texture generation failed: ${errorMessage}`);
        }
      } catch (error) {
        addDebugLog(`Error checking texture status: ${error.message}`);
        if (!mounted) return;
        console.error('Error checking texture status:', error);
      }
    };

    if (textureTaskId) {
      addDebugLog('Starting texture status monitoring');
      checkTextureStatus(); // Check immediately
      intervalId = setInterval(checkTextureStatus, 2000);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
        addDebugLog('Cleared texture status monitoring');
      }
    };
  }, [textureTaskId]);

// src/components/ModelEditor.jsx - key changes
const applyTexturesToModel = async (textureData) => {
  if (!modelRef.current || !textureData.texture_urls?.[0]) {
    console.log('No model or texture URLs available');
    return;
  }

  setIsApplyingTexture(true);
  try {
    console.log('Starting texture application with data:', textureData);
    const manager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(manager);

    // Setup loading manager
    manager.onProgress = (url, loaded, total) => {
      const progress = total ? Math.round((loaded / total) * 100) : 0;
      console.log(`Loading textures: ${progress}%`);
    };

    manager.onError = (url) => {
      console.error('Error loading texture:', url);
    };

    const loadTexture = async (url, type) => {
      if (!url) return null;
      console.log(`Loading ${type} texture from:`, url);
      
      return new Promise((resolve, reject) => {
        const proxyUrl = `${API_BASE_URL}/api/model-proxy?url=${encodeURIComponent(url)}`;
        
        textureLoader.load(
          proxyUrl,
          (texture) => {
            console.log(`${type} texture loaded successfully`);
            
            // Configure texture based on type
            if (type === 'baseColor') {
              texture.colorSpace = THREE.SRGBColorSpace;
            } else {
              texture.colorSpace = THREE.LinearSRGBColorSpace;
            }
            
            texture.flipY = false;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            
            resolve(texture);
          },
          undefined, // Don't track individual progress
          (error) => {
            console.error(`Failed to load ${type} texture:`, error);
            reject(error);
          }
        );
      });
    };

    const textures = textureData.texture_urls[0];
    console.log('Available texture maps:', textures);

    // Create materials beforehand
    const pbr = new THREE.MeshStandardMaterial({
      metalness: 1.0,
      roughness: 1.0,
      envMapIntensity: 1.0,
    });

    // Load and apply textures one by one to ensure proper loading
    if (textures.base_color) {
      pbr.map = await loadTexture(textures.base_color, 'baseColor');
    }
    if (textures.normal) {
      pbr.normalMap = await loadTexture(textures.normal, 'normal');
      pbr.normalScale.set(1, 1);
    }
    if (textures.roughness) {
      pbr.roughnessMap = await loadTexture(textures.roughness, 'roughness');
    }
    if (textures.metallic) {
      pbr.metalnessMap = await loadTexture(textures.metallic, 'metallic');
    }

    // Apply material to model
    modelRef.current.traverse((node) => {
      if (node.isMesh) {
        console.log('Processing mesh:', node.name);
        
        // Clean up old material
        if (node.material) {
          const oldMaterial = node.material;
          if (Array.isArray(oldMaterial)) {
            oldMaterial.forEach(mat => mat.dispose());
          } else {
            oldMaterial.dispose();
          }
        }

        // Apply new material
        node.material = pbr;
        node.material.needsUpdate = true;
        
        // Enable shadows
        node.castShadow = true;
        node.receiveShadow = true;

        console.log('Material updated:', {
          hasBaseColor: !!pbr.map,
          hasNormalMap: !!pbr.normalMap,
          hasRoughnessMap: !!pbr.roughnessMap,
          hasMetalnessMap: !!pbr.metalnessMap
        });
      }
    });

    // Ensure proper render update
    if (sceneSetupRef.current) {
      sceneSetupRef.current.renderer.render(
        sceneSetupRef.current.scene,
        sceneSetupRef.current.camera
      );
    }

  } catch (error) {
    console.error('Error applying textures:', error);
    setLoadError('Failed to apply textures: ' + error.message);
  } finally {
    setIsApplyingTexture(false);
  }
};

  const handleDownload = () => modelUrl && window.open(modelUrl, '_blank');
  const handleShare = () => modelUrl && navigator.clipboard.writeText(modelUrl).then(() => alert('Model URL copied to clipboard!'));
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  return (
    <div className="min-h-screen bg-[#1a1d21] text-white">
      <header className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <img src={logo} alt="Modelflow Logo" className="h-10" />
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="btn">Share</button>
            <button onClick={handleDownload} className="btn-primary">Download</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className={`grid gap-6 ${isFullscreen ? '' : 'grid-cols-1 lg:grid-cols-4'}`}>
          <Card className={`relative ${isFullscreen ? 'h-[80vh]' : 'lg:col-span-3 aspect-[4/3]'} bg-gray-800`}>
            {(isLoading || isApplyingTexture) && <LoadingOverlay message={isLoading ? 'Loading model...' : 'Applying textures...'} />}
            {loadError && <ErrorOverlay message={loadError} />}
            <div ref={containerRef} className="w-full h-full" />
            <button onClick={toggleFullscreen} className="fullscreen-toggle">
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </button>
          </Card>

          {!isFullscreen && <DetailsCard modelDetails={modelDetails} textureStatus={textureStatus} />}
          
          {!isFullscreen && (
            <Card className="p-4 bg-gray-800 rounded-lg lg:col-span-4">
              <h2 className="text-lg font-semibold mb-4">Texture Debug Log</h2>
              <div className="h-40 overflow-y-auto text-sm font-mono">
                {debugLog.map((log, index) => (
                  <div key={index} className="text-gray-300 border-b border-gray-700 py-1">
                    {log}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ModelEditorPage;