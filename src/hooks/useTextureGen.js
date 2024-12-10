import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const POLLING_INTERVAL = 5000;
const MAX_RETRIES = 120;

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidModelUrl = (url) => {
  if (!isValidUrl(url)) return false;
  const validExtensions = ['.glb', '.fbx', '.obj', '.gltf'];
  return validExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

export const useTextureGen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const statusCheckRef = useRef(null);
  const navigate = useNavigate();

  const stopStatusCheck = () => {
    if (statusCheckRef.current) {
      clearTimeout(statusCheckRef.current);
      statusCheckRef.current = null;
    }
    setRetryCount(0);
  };

  const generateTexture = async (modelUrl, objectPrompt, stylePrompt, artStyle = 'realistic') => {
    if (isLoading) return;
    
    // Validate model URL
    if (!modelUrl) {
      setErrorMessage('Model URL is required');
      return;
    }

    if (!isValidModelUrl(modelUrl)) {
      setErrorMessage('Invalid model URL. URL must be a complete HTTP/HTTPS URL pointing to a .glb, .fbx, .obj, or .gltf file');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setRetryCount(0);
    stopStatusCheck();
    
    try {
      // First, verify the model URL is accessible
      try {
        const modelCheck = await fetch(modelUrl, { method: 'HEAD' });
        if (!modelCheck.ok) {
          throw new Error('Model URL is not accessible. Please ensure the URL is public and valid.');
        }
      } catch (error) {
        throw new Error('Unable to access model URL. Please ensure the URL is public and valid.');
      }

      const response = await fetch(`${API_BASE_URL}/api/texture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelUrl,
          objectPrompt,
          stylePrompt,
          artStyle,
          // Add additional debugging info
          debug_info: {
            timestamp: new Date().toISOString(),
            model_url_length: modelUrl.length,
            model_url_extension: modelUrl.split('.').pop()
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error('A texture is already being generated. Please wait for it to complete.');
        }
        throw new Error(errorData.details || 'Failed to create texture task');
      }

      const data = await response.json();
      console.log('Texture task created:', data); // Add debugging log

      if (!data.task_id && !data.result) {
        throw new Error('Invalid task ID received');
      }

      const taskId = data.task_id || data.result;

      const checkStatus = async () => {
        try {
          if (retryCount >= MAX_RETRIES) {
            throw new Error('Texture generation timed out. Please try again.');
          }

          const statusResponse = await fetch(`${API_BASE_URL}/api/text-to-texture/${taskId}`);
          if (!statusResponse.ok) {
            throw new Error('Failed to fetch task status');
          }

          const statusData = await statusResponse.json();
          console.log('Task status:', statusData); // Add debugging log
          setTaskStatus(statusData);

          if (statusData.status === 'SUCCEEDED') {
            stopStatusCheck();
            setIsLoading(false);
            navigate('/editor', {
              state: {
                modelUrl: statusData.model_urls?.glb,
                modelDetails: {
                  name: objectPrompt,
                  format: 'GLB',
                  created: new Date().toLocaleString()
                },
                taskId
              }
            });
          } else if (statusData.status === 'FAILED') {
            stopStatusCheck();
            throw new Error(statusData.task_error?.message || 'Task failed');
          } else {
            setRetryCount(prev => prev + 1);
            statusCheckRef.current = setTimeout(checkStatus, POLLING_INTERVAL);
          }
        } catch (error) {
          stopStatusCheck();
          setErrorMessage(error.message);
          setIsLoading(false);
        }
      };

      checkStatus();
    } catch (error) {
      stopStatusCheck();
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => stopStatusCheck();
  }, []);

  return {
    generateTexture,
    isLoading,
    taskStatus,
    errorMessage,
    setErrorMessage,
    progress: retryCount / MAX_RETRIES * 100
  };
};