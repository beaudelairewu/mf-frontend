// src/utils/modelLoader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
class ModelLoader {
  static async loadModel(taskId) {
    try {
      // Health check
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      if (!healthResponse.ok) {
        throw new Error('Proxy server health check failed');
      }

      const healthData = await healthResponse.json();
      console.log('Proxy server health:', healthData);

      if (!healthData.apiKeyConfigured) {
        throw new Error('Proxy server is not configured with API key');
      }

      // Get model info
      console.log('Fetching task info:', `${API_BASE_URL}/api/text-to-3d/${taskId}`);
      const response = await fetch(`${API_BASE_URL}/api/text-to-3d/${taskId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Task info error:', errorData);
        throw new Error(errorData.details || response.statusText);
      }

      const data = await response.json();
      console.log('Task info response:', data);

      if (!data.model_urls?.glb) {
        throw new Error('No GLB URL found in response');
      }

      // Load model through proxy
      const proxyModelUrl = `${API_BASE_URL}/api/model-proxy?url=${encodeURIComponent(data.model_urls.glb)}`;
      console.log('Loading model through:', proxyModelUrl);

      return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        
        loader.load(
          proxyModelUrl,
          (gltf) => {
            // Process the loaded model
            gltf.scene.traverse((node) => {
              if (node.isMesh) {
                // Handle materials
                if (Array.isArray(node.material)) {
                  node.material.forEach(material => {
                    if (material.map) {
                      material.map.colorSpace = THREE.SRGBColorSpace;
                    }
                    material.needsUpdate = true;
                  });
                } else {
                  if (node.material.map) {
                    node.material.map.colorSpace = THREE.SRGBColorSpace;
                  }
                  node.material.needsUpdate = true;
                }
              }
            });

            console.log('Model loaded successfully with materials:', gltf.scene);
            resolve(gltf);
          },
          (progress) => {
            const percentComplete = (progress.loaded / progress.total * 100);
            console.log(`Loading progress: ${percentComplete.toFixed(2)}%`);
          },
          (error) => {
            console.error('GLTFLoader error:', error);
            reject(new Error(`Model loading failed: ${error.message}`));
          }
        );
      });
    } catch (error) {
      console.error('Model loading process failed:', error);
      throw error;
    }
  }

  static setupModelInScene(gltf, scene) {
    // Remove existing model if present
    const existingModel = scene.getObjectByName('loadedModel');
    if (existingModel) {
      scene.remove(existingModel);
      existingModel.traverse((child) => {
        if (child.isMesh) {
          if (child.material.map) {
            child.material.map.dispose();
          }
          child.geometry.dispose();
          if (child.material.isMaterial) {
            child.material.dispose();
          } else {
            child.material.forEach(material => material.dispose());
          }
        }
      });
    }

    // Setup new model
    gltf.scene.name = 'loadedModel';

    // Center and scale the model
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;

    gltf.scene.scale.setScalar(scale);
    gltf.scene.position.sub(center.multiplyScalar(scale));

    // Ensure proper material setup
    gltf.scene.traverse((node) => {
      if (node.isMesh) {
        // Enable shadows
        node.castShadow = true;
        node.receiveShadow = true;

        // Handle materials
        if (Array.isArray(node.material)) {
          node.material.forEach(material => {
            if (material.map) {
              material.map.colorSpace = THREE.SRGBColorSpace;
            }
            material.needsUpdate = true;
          });
        } else {
          if (node.material.map) {
            node.material.map.colorSpace = THREE.SRGBColorSpace;
          }
          node.material.needsUpdate = true;
        }
      }
    });

    scene.add(gltf.scene);
    return gltf.scene;
  }
}

export { ModelLoader };