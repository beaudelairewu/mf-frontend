// src/utils/modelLoader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL

class ModelLoaderColored {
  static async loadModel(taskId) {
    try {
      // Ensure taskId is clean of any URL parts
      
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

      if (!data.model_urls?.obj || !data.model_urls?.mtl) {
        throw new Error('Missing OBJ or MTL URLs in response');
      }

      // Create proxy URLs
      const proxyObjUrl = `${API_BASE_URL}/api/model-proxy?url=${encodeURIComponent(data.model_urls.obj)}`;
      const proxyMtlUrl = `${API_BASE_URL}/api/model-proxy?url=${encodeURIComponent(data.model_urls.mtl)}`;
      
      console.log('Loading model from:', { obj: proxyObjUrl, mtl: proxyMtlUrl });

      // First load the MTL
      return new Promise((resolve, reject) => {
        const mtlLoader = new MTLLoader();
        mtlLoader.crossOrigin = 'anonymous';
        
        mtlLoader.load(
          proxyMtlUrl,
          (materials) => {
            materials.preload();
            console.log('Materials loaded:', materials);

            // Then load the OBJ with the materials
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load(
              proxyObjUrl,
              (object) => {
                console.log('Object loaded successfully');
                
                // Process materials
                object.traverse((child) => {
                  if (child.isMesh) {
                    if (Array.isArray(child.material)) {
                      child.material.forEach(mat => {
                        mat.needsUpdate = true;
                        if (mat.map) {
                          mat.map.colorSpace = THREE.SRGBColorSpace;
                        }
                      });
                    } else {
                      child.material.needsUpdate = true;
                      if (child.material.map) {
                        child.material.map.colorSpace = THREE.SRGBColorSpace;
                      }
                    }
                  }
                });

                resolve({ scene: object });
              },
              (progress) => {
                const percentComplete = (progress.loaded / progress.total * 100);
                console.log(`Loading OBJ: ${percentComplete.toFixed(2)}%`);
              },
              (error) => {
                console.error('OBJ loading error:', error);
                reject(new Error(`Failed to load OBJ: ${error.message}`));
              }
            );
          },
          (progress) => {
            const percentComplete = (progress.loaded / progress.total * 100);
            console.log(`Loading MTL: ${percentComplete.toFixed(2)}%`);
          },
          (error) => {
            console.error('MTL loading error:', error);
            reject(new Error(`Failed to load MTL: ${error.message}`));
          }
        );
      });
    } catch (error) {
      console.error('Model loading process failed:', error);
      throw error;
    }
  }

  static setupModelInScene(result, scene) {
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

    const model = result.scene;
    model.name = 'loadedModel';

    // Center and scale the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;

    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));

    // Update materials and enable shadows
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        if (Array.isArray(node.material)) {
          node.material.forEach(material => {
            material.needsUpdate = true;
          });
        } else {
          node.material.needsUpdate = true;
        }
      }
    });

    scene.add(model);
    return model;
  }
}

export { ModelLoaderColored };