import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rotate3d } from 'lucide-react';
import SearchInterface from './SearchInterface';

const ModelGenerator = () => {
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

          // Navigate immediately with the 3D model
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

          // Start texture generation after a delay
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
          }, 2000); // 2-second delay before starting texture generation
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

  const handleSearch = async (query) => {
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

  const handleRandom = () => {
    const randomPrompts = [
      'A cute robot companion with friendly features',
      'An ancient magical crystal formation',
      'A steampunk pocket watch with intricate gears',
      'A mystical floating island with waterfalls',
      'A futuristic hover vehicle with neon accents',
    ];
    const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
    handleSearch(randomPrompt);
  };

  return (
    <>
      <SearchInterface onSearch={handleSearch} onRandom={handleRandom} />

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="animate-spin mb-4">
              <Rotate3d className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-white text-center">
              Generating your 3D model...
              {taskStatus?.progress !== undefined && ` (${taskStatus.progress}%)`}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg">
          <p className="font-semibold">Error</p>
          <p>{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="absolute top-2 right-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
};

export default ModelGenerator;