import { useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';

export const useImageGen = (setShowDrawing, setIsLoading, setError) => {
  const navigate = useNavigate();
  const [taskStatus, setTaskStatus] = useState(null);

  const handleSearch = (searchQuery, displayText, onSearch) => (e) => {
    e.preventDefault();
    onSearch(searchQuery || displayText);
  };

  const handleImageReady = useCallback(async (imageData) => {
    setShowDrawing(false);
    setIsLoading(true);
    setError(null);
    setTaskStatus(null);

    try {
      // Make the API request to create image-to-3d task
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/image-to-3d`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          artStyle: 'realistic',
          aiModel: 'meshy-4'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to process image');
      }

      const data = await response.json();
      const taskId = data.result;

      // Poll for task completion
      let currentTaskStatus;
      do {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/image-to-3d/${taskId}`
        );
        
        if (!statusResponse.ok) {
          throw new Error('Failed to check task status');
        }
        
        currentTaskStatus = await statusResponse.json();
        
        // Update task status with progress
        setTaskStatus({
          status: currentTaskStatus.status,
          progress: currentTaskStatus.progress || 0,
          error: currentTaskStatus.task_error
        });
        
        if (currentTaskStatus.status === 'FAILED') {
          throw new Error(currentTaskStatus.task_error?.message || 'Task failed');
        }
      } while (currentTaskStatus.status === 'PENDING' || currentTaskStatus.status === 'IN_PROGRESS');

      // Navigate to editor with the generated model
      if (currentTaskStatus.status === 'SUCCEEDED') {
        navigate('/editor', {
          state: {
            modelUrl: currentTaskStatus.model_urls.glb,
            taskId: currentTaskStatus.id,
            modelDetails: {
              name: '0',
              format: 'GLB',
              size: '0',
              created: new Date(currentTaskStatus.created_at).toLocaleDateString()
            }
          },
          replace: true
        });
      }
    } catch (error) {
      console.error('Image processing failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      setTaskStatus(null);
    }
  }, [navigate, setShowDrawing, setIsLoading, setError]);

  return {
    handleSearch,
    handleImageReady,
    taskStatus
  };
};