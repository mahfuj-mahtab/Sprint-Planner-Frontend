import React from 'react'
import api from '../ApiInception';
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify';

function MemberCard({ name, id,orgId,role }) {
    const handleMemberDelete = (id) => {
        api.patch(`/api/v1/users/org/delete/member/${id}/${orgId}`).then((response) => {
            console.log(response.data.message)
            // onClose();
            toast.success(response.data.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });
            // if (onAddMember) {
            //     onAddMember();
            // }
        }).catch((error) => {
            console.log(error.response.data);
            toast.error(error.response.data.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",

            });
            console.error("There was an error!", error);
        });
    }
    return (
        <div className='w-auto border-2 h-26 rounded-lg pt-4 pl-4 pb-4 pr-2 bg-white shadow-md'>
            <div className='flex items-center mb-4'>
                <div>

                    <img src="https://avatars.githubusercontent.com/u/30542294?v=4" alt="Profile" className="w-10 h-10 rounded-full mr-3" />
                </div>
                <div className=''>
                    <h3 className='text-md font-semibold'>{name}</h3>
                    <p className='text-sm text-gray-500'>{role}</p>
                </div>
                <div className='mt-[-20px] ml-20'>
                    <div className="flex space-x-2">

                        <button className="text-green-600 hover:text-green-800">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button className="text-red-600 hover:text-red-800" onClick={() => { handleMemberDelete(id) }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            </div>
            {/* <p className='text-gray-700 mb-4'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p> */}
            {/* <button className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'>View Profile</button> */}
        </div>
    )
}

export default MemberCard