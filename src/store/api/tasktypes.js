import client from './client'

export default {
  getTaskTypes (callback) {
    client.get('/api/data/task-types', callback)
  },

  newTaskType (taskType, callback) {
    const data = {
      name: taskType.name,
      color: taskType.color,
      priority: Number(taskType.priority),
      for_shots: Boolean(taskType.for_shots === 'true')
    }
    client.post('/api/data/task-types/', data, callback)
  },

  updateTaskType (taskType, callback) {
    const data = {
      name: taskType.name,
      color: taskType.color,
      priority: Number(taskType.priority),
      for_shots: Boolean(taskType.for_shots === 'true')
    }
    client.put(`/api/data/task-types/${taskType.id}`, data, callback)
  },

  deleteTaskType (taskType, callback) {
    client.del(`/api/data/task-types/${taskType.id}`, callback)
  },

  getSequenceSubscriptions (projectId, taskTypeId, callback) {
    client.get(
      `/api/data/user/projects/${projectId}/task-types/${taskTypeId}/` +
      `sequence-subscriptions`,
      callback
    )
  }
}
