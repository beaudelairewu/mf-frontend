// src/services/meshyApi.js
const MESHY_API_ENDPOINT = 'https://api.meshy.ai/v2';

export class MeshyApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async createPreviewTask(prompt, options = {}) {
    try {
      const response = await fetch(`${MESHY_API_ENDPOINT}/text-to-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: "preview",
          prompt,
          art_style: options.artStyle || "realistic",
          negative_prompt: options.negativePrompt || "",
          ai_model: options.aiModel || "meshy-4"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create preview task');
      }

      const data = await response.json();
      console.log('Preview task created:', data); // Debug log
      return data.result;
    } catch (error) {
      console.error('Create preview task error:', error);
      throw error;
    }
  }

  async getTaskStatus(taskId) {
    if (!taskId) {
      throw new Error('Task ID is required');
    }

    try {
      console.log('Checking status for task:', taskId); // Debug log
      const response = await fetch(`${MESHY_API_ENDPOINT}/text-to-3d/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get task status');
      }

      const data = await response.json();
      console.log('Task status response:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Get task status error:', error);
      throw error;
    }
  }

  async createRefineTask(previewTaskId) {
    if (!previewTaskId) {
      throw new Error('Preview task ID is required');
    }

    try {
      const response = await fetch(`${MESHY_API_ENDPOINT}/text-to-3d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: "refine",
          preview_task_id: previewTaskId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create refine task');
      }

      const data = await response.json();
      console.log('Refine task created:', data); // Debug log
      return data.result;
    } catch (error) {
      console.error('Create refine task error:', error);
      throw error;
    }
  }
}
