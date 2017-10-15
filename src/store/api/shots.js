import client from './client'

export default {
  getShot (shotId, callback) {
    const path = `/api/data/shots/${shotId}`
    client.get(path, callback)
  },

  getShots (currentProduction, callback) {
    let path = '/api/data/shots/with-tasks'
    if (currentProduction) {
      path += `?project_id=${currentProduction.id}`
    }
    client.get(path, callback)
  },

  getShotType (callback) {
    client.get('/api/data/shot-type', callback)
  },

  newShot (shot, callback) {
    const data = {
      name: shot.name,
      entity_type_id: shot.shot_type_id,
      project_id: shot.production_id
    }
    client.post(`/api/data/entities/`, data, callback)
  },

  updateShot (shot, callback) {
    const data = {
      name: shot.name,
      entity_type_id: shot.shot_type_id,
      project_id: shot.project_id
    }
    client.put(`/api/data/entities/${shot.id}`, data, callback)
  },

  updateCasting (shot, callback) {
    const data = shot.entities_out
    client.put(`/api/actions/shots/${shot.id}/casting`, data, callback)
  },

  deleteShot (shot, callback) {
    client.del(`/api/data/shots/${shot.id}`, callback)
  },

  postCsv (formData, callback) {
    client.post('/api/import/csv/shots', formData, callback)
  }
}
