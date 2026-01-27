import { createSlice } from "@reduxjs/toolkit";
import { set } from "react-hook-form";

const initialState = {
    user : null,
    isAuthenticated : false,
    refreshToken : null,
    accessToken : null,
}
const authSlice = createSlice({
    name : 'auth',
    initialState,
    reducers:{
        login(state,action){
            console.log(action.payload,"action payload")
            state.user = action.payload.user,
            state.accessToken = action.payload.accessToken
            state.refreshToken = action.payload.refreshToken
            state.isAuthenticated = true
        },
        logout(state){
            state.user = null,
            state.isAuthenticated = false
        },
        setAccessToken(state, action) {
            state.access_token = action.payload;
        },
        setUserDetails(state,action){
            state.user = action.payload.user
        },
        setEmployeeDetails(state,action){
            state.employee = action.payload.employee
            state.isEmployee = true
            state.isEmployeeAuthenticated = true
        }
    }
})
export const {login,logout,setAccessToken, setUserDetails,setEmployeeDetails} = authSlice.actions

export default authSlice.reducer