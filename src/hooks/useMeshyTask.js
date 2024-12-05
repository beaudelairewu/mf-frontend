// src/hooks/useMeshyTask.js
import { useState, useEffect } from 'react';

export function useMeshyTask(meshyApi, taskId) {
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let intervalId;
    let mounted = true;
    
    const checkStatus = async () => {
      if (!taskId) return;
      
      try {
        const taskStatus = await meshyApi.getTaskStatus(taskId);
        if (!mounted) return;
        
        setTask(taskStatus);
        console.log('Current task status:', taskStatus); // Debug log
        
        if (taskStatus.status === 'SUCCEEDED' || taskStatus.status === 'FAILED') {
          clearInterval(intervalId);
          setIsLoading(false);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Task status check failed:', err);
        setError(err);
        clearInterval(intervalId);
        setIsLoading(false);
      }
    };

    if (taskId) {
      setIsLoading(true);
      setError(null);
      checkStatus();
      intervalId = setInterval(checkStatus, 2000);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [meshyApi, taskId]);

  return { task, error, isLoading };
}