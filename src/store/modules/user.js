import peopleApi from '../api/people'
import peopleStore from './people'
import taskStatusStore from './taskstatus'
import auth from '../../lib/auth'
import { sortTasks, sortByName } from '../../lib/sorting'
import { indexSearch, buildTaskIndex } from '../../lib/indexing'
import {
  populateTask,
  buildSelectionGrid,
  clearSelectionGrid
} from '../../lib/helpers'

import {
  USER_LOGIN,
  USER_LOGOUT,
  USER_LOGIN_FAIL,

  USER_SAVE_PROFILE_LOADING,
  USER_SAVE_PROFILE_ERROR,
  USER_SAVE_PROFILE_SUCCESS,

  USER_CHANGE_PASSWORD_LOADING,
  USER_CHANGE_PASSWORD_ERROR,
  USER_CHANGE_PASSWORD_SUCCESS,
  USER_CHANGE_PASSWORD_UNVALID,

  USER_LOAD_TODOS_START,
  USER_LOAD_TODOS_END,
  USER_LOAD_TODOS_ERROR,
  USER_LOAD_DONE_TASKS_END,

  UPLOAD_AVATAR_END,

  CHANGE_AVATAR_FILE,

  NEW_TASK_COMMENT_END,

  SET_TODOS_SEARCH,

  ADD_SELECTED_TASK,
  REMOVE_SELECTED_TASK,
  CLEAR_SELECTED_TASKS,

  LOAD_USER_FILTERS_END,
  LOAD_USER_FILTERS_ERROR,

  SAVE_TODO_SEARCH_END,
  REMOVE_TODO_SEARCH_END,

  RESET_ALL
} from '../mutation-types'

const helpers = {
  getTaskStatus (taskStatusId) {
    return taskStatusStore.state.taskStatusMap[taskStatusId]
  }
}

const state = {
  user: null,

  isTodosLoading: false,
  isTodosLoadingError: false,
  todos: [],
  displayedTodos: [],
  displayedDoneTasks: [],
  todosIndex: {},
  todosSearchText: '',
  todoSelectionGrid: {},
  todoSearchQueries: [],

  avatarFormData: null,

  isAuthenticated: false,
  isSaveProfileLoading: false,
  isSaveProfileLoadingError: false,

  userFilters: {},

  changePassword: {
    isLoading: false,
    isError: false,
    isSuccess: false,
    isValid: true
  }
}

const getters = {
  user: state => state.user,
  isAuthenticated: state => state.isAuthenticated,
  isCurrentUserManager: state => state.user && state.user.role !== 'user',
  isCurrentUserAdmin: state => state.user && state.user.role === 'admin',
  displayedTodos: state => state.displayedTodos,
  displayedDoneTasks: state => state.displayedDoneTasks,
  todosSearchText: state => state.todosSearchText,
  todoSelectionGrid: state => state.todoSelectionGrid,
  todoSearchQueries: state => state.todoSearchQueries,

  isSaveProfileLoading: state => state.isSaveProfileLoading,
  isSaveProfileLoadingError: state => state.isSaveProfileLoadingError,

  isTodosLoading: state => state.isTodosLoading,
  isTodosLoadingError: state => state.isTodosLoadingError,

  changePassword: state => state.changePassword,

  userFilters: state => state.userFilters
}

const actions = {
  saveProfile ({ commit, state }, payload) {
    commit(USER_SAVE_PROFILE_LOADING)
    peopleApi.updatePerson(payload.form, (err) => {
      if (err) {
        commit(USER_SAVE_PROFILE_ERROR)
      } else {
        commit(USER_SAVE_PROFILE_SUCCESS, payload.form)
      }
      if (payload.callback) payload.callback()
    })
  },

  checkNewPasswordValidityAndSave ({ commit, state }, payload) {
    if (auth.isPasswordValid(
      payload.form.password,
      payload.form.password2
    )) {
      actions.changeUserPassword({ commit, state }, payload)
    } else {
      commit(USER_CHANGE_PASSWORD_UNVALID)
      if (payload.callback) payload.callback()
    }
  },

  changeUserPassword ({ commit, state }, payload) {
    commit(USER_CHANGE_PASSWORD_LOADING)
    peopleApi.changePassword(payload.form, (err) => {
      if (err) {
        commit(USER_CHANGE_PASSWORD_ERROR)
      } else {
        commit(USER_CHANGE_PASSWORD_SUCCESS)
      }
      if (payload.callback) payload.callback()
    })
  },

  loadTodos ({ commit, state, rootGetters }, { callback, forced }) {
    const userFilters = rootGetters.userFilters

    if (state.todos.length === 0 || forced) {
      commit(USER_LOAD_TODOS_START)
      peopleApi.loadTodos((err, tasks) => {
        if (err) {
          commit(USER_LOAD_TODOS_ERROR)
          if (callback) callback(err)
        } else {
          peopleApi.loadDone((err, doneTasks) => {
            if (err) {
              commit(USER_LOAD_TODOS_ERROR)
            } else {
              commit(USER_LOAD_TODOS_END, { tasks, userFilters })
              commit(USER_LOAD_DONE_TASKS_END, doneTasks)
            }
            if (callback) callback(err)
          })
        }
      })
    } else {
      if (callback) callback()
    }
  },

  uploadAvatar ({ commit, state }, callback) {
    peopleApi.postAvatar(state.user.id, state.avatarFormData, (err) => {
      if (!err) commit(UPLOAD_AVATAR_END, state.user.id)
      if (callback) callback(err)
    })
  },

  setTodosSearch ({ commit, state }, searchText) {
    commit(SET_TODOS_SEARCH, searchText)
  },

  loadUserSearchFilters ({ commit }, callback) {
    peopleApi.getUserSearchFilters((err, searchFilters) => {
      if (err) commit(LOAD_USER_FILTERS_ERROR)
      else commit(LOAD_USER_FILTERS_END, searchFilters)
      callback(err)
    })
  },

  saveTodoSearch ({ commit, rootGetters }, searchQuery) {
    return new Promise((resolve, reject) => {
      const query = state.todoSearchQueries.find(
        (query) => query.name === searchQuery
      )

      if (!query) {
        peopleApi.createFilter(
          'todos',
          searchQuery,
          searchQuery,
          null,
          (err, searchQuery) => {
            commit(SAVE_TODO_SEARCH_END, { searchQuery })
            if (err) {
              reject(err)
            } else {
              resolve(searchQuery)
            }
          }
        )
      } else {
        resolve()
      }
    })
  },

  removeTodoSearch ({ commit, rootGetters }, searchQuery) {
    return new Promise((resolve, reject) => {
      peopleApi.removeFilter(searchQuery, (err) => {
        commit(REMOVE_TODO_SEARCH_END, { searchQuery })
        if (err) reject(err)
        else resolve()
      })
    })
  }
}

const mutations = {
  [USER_LOGIN] (state, user) {
    state.user = peopleStore.helpers.addAdditionalInformation(user)
    state.isAuthenticated = true
  },
  [USER_LOGOUT] (state, user) {
    state.user = null
    state.isAuthenticated = false
  },
  [USER_LOGIN_FAIL] (state, user) {
    state.user = null
    state.isAuthenticated = false
  },

  [USER_SAVE_PROFILE_LOADING] (state) {
    state.isSaveProfileLoading = true
    state.isSaveProfileLoadingError = false
  },
  [USER_SAVE_PROFILE_ERROR] (state) {
    state.isSaveProfileLoading = false
    state.isSaveProfileLoadingError = true
  },
  [USER_SAVE_PROFILE_SUCCESS] (state, form) {
    Object.assign(state.user, form)
    state.isSaveProfileLoading = false
    state.isSaveProfileLoadingError = false
  },

  [USER_CHANGE_PASSWORD_LOADING] (state) {
    state.changePassword = {
      isLoading: true,
      isError: false,
      isSuccess: false,
      isValid: true
    }
  },
  [USER_CHANGE_PASSWORD_ERROR] (state) {
    state.changePassword = {
      isLoading: false,
      isError: true,
      isSuccess: false,
      isValid: true
    }
  },
  [USER_CHANGE_PASSWORD_SUCCESS] (state) {
    state.changePassword = {
      isLoading: false,
      isError: false,
      isSuccess: true,
      isValid: true
    }
  },
  [USER_CHANGE_PASSWORD_UNVALID] (state) {
    state.changePassword = {
      isLoading: false,
      isError: false,
      isSuccess: false,
      isValid: false
    }
  },

  [USER_LOAD_TODOS_START] (state) {
    state.isTodosLoadingError = false
    state.isTodosLoading = true
  },

  [USER_LOAD_TODOS_END] (state, { tasks, userFilters }) {
    state.isTodosLoading = false
    tasks.forEach(populateTask)
    tasks.forEach((task) => {
      const taskStatus = helpers.getTaskStatus(task.task_status_id)
      task.taskStatus = taskStatus
    })

    state.todoSelectionGrid = buildSelectionGrid(tasks.length, 1)
    state.todos = sortTasks(tasks)

    state.todosIndex = buildTaskIndex(tasks)
    const searchResult = indexSearch(state.todosIndex, state.todosSearchText)
    state.displayedTodos = searchResult || state.todos
    if (userFilters.todos && userFilters.todos.all) {
      state.todoSearchQueries = userFilters.todos.all
    } else {
      state.todoSearchQueries = []
    }
  },

  [USER_LOAD_DONE_TASKS_END] (state, tasks) {
    tasks.forEach(populateTask)
    tasks.forEach((task) => {
      const taskStatus = helpers.getTaskStatus(task.task_status_id)
      task.taskStatus = taskStatus
    })
    state.displayedDoneTasks = tasks
  },

  [USER_LOAD_TODOS_ERROR] (state, tasks) {
    state.isTodosLoadingError = true
  },

  [CHANGE_AVATAR_FILE] (state, formData) {
    state.avatarFormData = formData
  },

  [UPLOAD_AVATAR_END] (state) {
    if (state.user) {
      const randomHash = Math.random().toString(36).substring(7)
      state.user.has_avatar = true
      state.user.avatarPath =
        `/api/pictures/thumbnails/persons/${state.user.id}` +
        `.png?unique=${randomHash}`
    }
  },

  [NEW_TASK_COMMENT_END] (state, {comment, taskId}) {
    const task = state.todos.find((task) => task.id === taskId)

    if (task) {
      const taskStatus = helpers.getTaskStatus(comment.task_status_id)

      Object.assign(task, {
        task_status_id: taskStatus.id,
        task_status_name: taskStatus.name,
        task_status_short_name: taskStatus.short_name,
        task_status_color: taskStatus.color,
        last_comment: comment
      })
      state.todosIndex = buildTaskIndex(state.todos)
    }
  },

  [SET_TODOS_SEARCH] (state, searchText) {
    const searchResult = indexSearch(state.todosIndex, searchText)
    state.todosSearchText = searchText
    state.displayedTodos = searchResult || state.todos
  },

  [SAVE_TODO_SEARCH_END] (state, { searchQuery }) {
    state.todoSearchQueries.push(searchQuery)
    state.todoSearchQueries = sortByName(state.todoSearchQueries)
  },

  [REMOVE_TODO_SEARCH_END] (state, { searchQuery }) {
    const queryIndex = state.todoSearchQueries.findIndex(
      (query) => query.name === searchQuery.name
    )
    if (queryIndex >= 0) {
      state.todoSearchQueries.splice(queryIndex, 1)
    }
  },

  [ADD_SELECTED_TASK] (state, validationInfo) {
    if (state.todoSelectionGrid && state.todoSelectionGrid[0]) {
      state.todoSelectionGrid[validationInfo.x][validationInfo.y] = true
    }
  },

  [REMOVE_SELECTED_TASK] (state, validationInfo) {
    if (state.todoSelectionGrid && state.todoSelectionGrid[0]) {
      state.todoSelectionGrid[validationInfo.x][validationInfo.y] = false
    }
  },

  [CLEAR_SELECTED_TASKS] (state) {
    state.todoSelectionGrid = clearSelectionGrid(state.todoSelectionGrid)
  },

  [LOAD_USER_FILTERS_ERROR] (state) {
  },
  [LOAD_USER_FILTERS_END] (state, userFilters) {
    state.userFilters = userFilters
  },

  [RESET_ALL] (state) {
    state.user = null
    state.isAuthenticated = false
    state.isSaveProfileLoading = false
    state.isSaveProfileLoadingError = false

    state.isTodosLoading = false
    state.isTodosLoadingError = false
    state.todos = []
    state.todoSelectionGrid = {}
    state.todoSearchQueries = []

    state.userFilters = {}

    state.changePassword = {
      isLoading: false,
      isError: false,
      isSuccess: false,
      isValid: false
    }
  }
}

export default {
  namespace: true,
  state,
  getters,
  actions,
  mutations
}
