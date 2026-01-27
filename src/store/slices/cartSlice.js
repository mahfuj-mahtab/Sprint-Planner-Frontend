import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cart : [],
    cartLength : 0,
}
const cartSlice = createSlice({
    name : 'cart',
    initialState,
    reducers:{
        addToCart(state, action) {
            const item = action.payload;
            const existingItem = state.cart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                state.cart.push(item);
            }
            state.cartLength = state.cart.length;
            
        },
        removeFromCart(state, action) {
            const id = action.payload;
            state.cart = state.cart.filter(item => item.product_id !== id);
            state.cartLength = state.cart.length;
           
        },
        clearCart(state) {
            state.cart = [];
            state.cartLength = 0;
            
        }
    }
})
export const {addToCart,removeFromCart,clearCart} = cartSlice.actions

export default cartSlice.reducer