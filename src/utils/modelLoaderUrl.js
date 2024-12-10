import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SceneSetup } from '../utils/sceneSetup';
import { Loader } from 'lucide-react';

const ModelPreview = ({ modelUrl }) => {
  const containerRef = useRef(null);
  const sceneSetupRef = useRef(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    sceneSetupRef.current = new SceneSetup(containerRef.current);
    sceneSetupRef.current.init();

    return () => sceneSetupRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (!modelUrl || !sceneSetupRef.current) return;

    const loadModel = async () => {
      try {
        const loader = new GLTFLoader();
        const gltf = await new Promise((resolve, reject) => {
          loader.load(
            modelUrl,
            resolve,
            (progress) => setLoadingProgress((progress.loaded / progress.total) * 100),
            reject
          );
        });

        const scene = sceneSetupRef.current.scene;
        scene.clear();

        gltf.scene.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            if (node.material.map) {
              node.material.map.colorSpace = THREE.SRGBColorSpace;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const scale = 2 / Math.max(size.x, size.y, size.z);

        gltf.scene.scale.setScalar(scale);
        gltf.scene.position.sub(center.multiplyScalar(scale));

        scene.add(gltf.scene);
      } catch (error) {
        setError(error.message);
      }
    };

    loadModel();
  }, [modelUrl]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {loadingProgress < 100 && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            <div className="text-sm text-gray-200">{loadingProgress.toFixed(0)}%</div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <div className="text-red-500 text-center">
            Failed to load model: {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelPreview;