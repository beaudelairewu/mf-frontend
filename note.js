import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Share2, Rotate3d, Maximize2, Minimize2 } from 'lucide-react';
import { Card } from './Card';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate } from 'react-router-dom';
import logo from '../images/modelflow.png';

const ModelEditorPage = ({ modelUrl, modelDetails }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    console.log('Setting up 3D scene with model URL:', modelUrl);

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1d21);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Load the model
    if (modelUrl) {
      setIsLoading(true);
      setLoadError(null);

      const loader = new GLTFLoader();

      // Custom fetch function for authentication
      const fetchWithAuth = async (url) => {
        try {
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${process.env.REACT_APP_MESHY_API_KEY}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return response;
        } catch (error) {
          console.error('Error fetching model:', error);
          throw error;
        }
      };

      loader.load(
        modelUrl,
        (gltf) => {
          console.log('Model loaded successfully:', gltf);
          
          if (modelRef.current) {
            scene.remove(modelRef.current);
            modelRef.current.traverse((child) => {
              if (child.isMesh) {
                child.geometry.dispose();
                if (child.material.isMaterial) {
                  child.material.dispose();
                } else {
                  child.material.forEach((material) => material.dispose());
                }
              }
            });
          }

          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          
          gltf.scene.scale.setScalar(scale);
          gltf.scene.position.sub(center.multiplyScalar(scale));
          
          modelRef.current = gltf.scene;
          scene.add(gltf.scene);

          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.material.needsUpdate = true;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          setIsLoading(false);
        },
        (progress) => {
          const percentage = (progress.loaded / progress.total * 100);
          console.log('Loading progress:', percentage + '%');
        },
        (error) => {
          console.error('Error loading model:', error);
          setLoadError(error.message);
          setIsLoading(false);
        },
        { fetch: fetchWithAuth }
      );
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (modelRef.current) {
        scene.remove(modelRef.current);
        modelRef.current.traverse((child) => {
          if (child.isMesh) {
            child.geometry.dispose();
            if (child.material.isMaterial) {
              child.material.dispose();
            } else {
              child.material.forEach((material) => material.dispose());
            }
          }
        });
      }
      
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (rendererRef.current && containerRef.current) {
        rendererRef.current.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
        if (cameraRef.current) {
          cameraRef.current.aspect = 
            containerRef.current.clientWidth / containerRef.current.clientHeight;
          cameraRef.current.updateProjectionMatrix();
        }
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#1a1d21] text-white">
      <header className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <button 
            onClick={handleLogoClick}
            className="flex items-start hover:opacity-80 transition-opacity"
          >
            <div className="flex items-start gap-3">
              <img 
                src={logo} 
                alt="Modelflow Logo" 
                className="w-11 h-10 mt-1"
              />
              <div className="text-left">
                <h1 className="text-white text-2xl font-bold tracking-wide leading-none">MODELFLOW</h1>
                <p className="text-gray-400 text-sm -mt-1">Where ideas become reality.</p>
              </div>
            </div>
          </button>
          
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