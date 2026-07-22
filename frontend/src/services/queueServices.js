/** Service wrapping backend queue operations for routine processing. */
import api from './api';
/** Service for communicating with the backend queue processing API. */
class QueueService {
  /** Check if the backend queue is healthy and processing. */
  async checkQueueHealth() {
    try {
      const response = await api.get('/health/queue');
      return response.data;
    } catch (error) {
      console.error('Queue health check failed:', error);
      return { 
        success: false, 
        message: 'Queue health check failed',
        error: error.message 
      };
    }
  }

  // Get general API health
  async checkAPIHealth() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('API health check failed:', error);
      return { 
        success: false, 
        message: 'API health check failed',
        error: error.message 
      };
    }
  }

  // Monitor queue status (could be used for dashboard)
  async getQueueStats() {
    try {
      const health = await this.checkQueueHealth();
      const apiHealth = await this.checkAPIHealth();
      
      return {
        queue: health,
        api: apiHealth,
        overall: health.success && apiHealth.success ? 'healthy' : 'degraded'
      };
    } catch (error) {
      return {
        queue: { success: false },
        api: { success: false },
        overall: 'unhealthy',
        error: error.message
      };
    }
  }

  // Trigger manual teacher schedule regeneration (if needed)
  async triggerTeacherScheduleUpdate(teacherId) {
    try {
      const response = await api.post('/routines/regenerate-teacher-schedule', {
        teacherId
      });
      return response.data;
    } catch (error) {
      console.error('Manual teacher schedule update failed:', error);
      throw error;
    }
  }

  // Get queue processing status (for UI feedback)
  async getProcessingStatus() {
    try {
      const response = await api.get('/queue/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get processing status:', error);
      return { 
        success: false, 
        processing: false,
        error: error.message 
      };
    }
  }
}

// Create singleton instance
const queueService = new QueueService();

export default queueService;

// Named exports for individual functions
export const checkQueueHealth = () => queueService.checkQueueHealth();
export const checkAPIHealth = () => queueService.checkAPIHealth();
export const getQueueStats = () => queueService.getQueueStats();
export const triggerTeacherScheduleUpdate = (teacherId) => queueService.triggerTeacherScheduleUpdate(teacherId);
export const getProcessingStatus = () => queueService.getProcessingStatus();
