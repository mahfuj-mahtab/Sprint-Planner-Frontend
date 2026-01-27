// import {configureStore} from '@reduxjs/toolkit'
// import rootReducer from './rootReducer';
// const store = configureStore({
//     reducer : rootReducer,
//     // middleware : (getDefaultMiddleware)=>{
//     //     getDefaultMiddleware().concat()
//     // },
//     // devTools: false,
// })
// export default store;
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootReducer'

// --- Load state from localStorage ---
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('app_state')
    if (serializedState === null) return undefined
    return JSON.parse(serializedState)
  } catch (e) {
    console.warn('Could not load state:', e)
    return undefined
  }
}

// --- Save state to localStorage ---
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem('app_state', serializedState)
  } catch (e) {
    console.warn('Could not save state:', e)
  }
}

// --- Configure Store ---
const persistedState = loadState()

const store = configureStore({
  reducer: rootReducer,
  preloadedState: persistedState,
})

// --- Subscribe to store changes ---
store.subscribe(() => {
  saveState(store.getState())
})

export default store
