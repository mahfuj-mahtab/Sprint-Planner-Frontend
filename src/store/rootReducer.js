import { combineReducers } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice'
import cartSlice from "./slices/cartSlice";
const rootReducer = combineReducers({
    auth : authReducer,
    cart : cartSlice
})
export default rootReducer