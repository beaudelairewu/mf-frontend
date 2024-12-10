import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const useTextGen = () => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [textureTaskId, setTextureTaskId] = useState(null);
  const [lastPrompt, setLastPrompt] = useState('');

  useEffect(() => {

    let intervalId;

    const checkTaskStatus = async () => {
      if (!currentTaskId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/text-to-3d/${currentTaskId}`);
        const taskData = await response.json();

        setTaskStatus(taskData);

        if (taskData.status === 'SUCCEEDED') {
          clearInterval(intervalId);
          setIsLoading(false);

          navigate('/editor', {
            state: {
              modelUrl: taskData.model_urls.glb,
              taskId: taskData.id,
              modelDetails: {
                name: taskData.prompt,
                format: 'GLB',
                size: '0',
                created: new Date(taskData.created_at).toLocaleDateString(),
              },
            },
            replace: true,
          });

          setTimeout(async () => {
            try {
              const textureResponse = await fetch(`${API_BASE_URL}/api/texture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  modelUrl: taskData.model_urls.obj,
                  objectPrompt: lastPrompt,
                  stylePrompt: `High quality realistic textures for ${lastPrompt}`,
                  artStyle: 'realistic',
                }),
              });

              if (textureResponse.ok) {
                const data = await textureResponse.json();
                setTextureTaskId(data.result);
                console.log('Texture generation started:', data.result);
              }
            } catch (error) {
              console.error('Failed to start texture generation:', error);
            }
          }, 2000);
        } else if (taskData.status === 'FAILED') {
          clearInterval(intervalId);
          setIsLoading(false);
          setErrorMessage(taskData.task_error?.message || 'Model generation failed');
        }
      } catch (error) {
        console.error('Error checking task status:', error);
        clearInterval(intervalId);
        setIsLoading(false);
        setErrorMessage(error.message);
      }
    };

    if (currentTaskId) {
      intervalId = setInterval(checkTaskStatus, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentTaskId, navigate, lastPrompt]);

  const generateModel = async (query) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setCurrentTaskId(null);
      setTextureTaskId(null);
      setTaskStatus(null);
      setLastPrompt(query);

      const requestBody = {
        mode: 'preview',
        prompt: query,
        art_style: 'realistic',
        ai_model: 'meshy-4',
        topology: 'triangle',
        target_polycount: 30000,
      };

      const response = await fetch(`${API_BASE_URL}/api/text-to-3d/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create model generation task');
      }

      const data = await response.json();
      if (!data.result) {
        throw new Error('No task ID received from server');
      }

      console.log('Received task ID:', data.result);
      setCurrentTaskId(data.result);
    } catch (error) {
      console.error('Model generation failed:', error);
      setIsLoading(false);
      setErrorMessage(error.message);
    }
  };

  return {
    generateModel,
    isLoading,
    taskStatus,
    errorMessage,
    setErrorMessage,
    textureTaskId
  };
};

export default useTextGen;