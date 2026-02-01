import React from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router';

function Profileheader() {
    const user = useSelector(state => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="w-full h-14 bg-gray-50 flex items-center justify-between px-6 border-b-2">
            <div className="text-dark font-medium text-sm">
                Sprint Planner
            </div>

            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>

                <span className="text-dark text-sm hidden sm:block">
                    {user?.fullName || user?.email || 'User'}
                </span>

                <button
                    onClick={handleLogout}
                    className="text-dark hover:text-red-400 text-sm transition"
                >
                    Logout
                </button>
            </div>
        </div>



    )
}

export default Profileheader
