import React, { useEffect } from 'react'
import { useForm } from "react-hook-form"
import { toast } from 'react-toastify';
import api from '../ApiInception';
function UserEdit({ onClose, fetchUser, userDetails }) {
    const {
        register,
        handleSubmit,
        reset,
    } = useForm()
    const onSubmit = (data) => {
        api.patch(`/api/v1/users/profile/edit`, data).then((response) => {
            console.log(response.data.message)
            onClose();
            toast.success(response.data.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",

            });
            fetchUser()
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
                theme: "dark",

            });
            console.error("There was an error!", error);
        });
    }
    useEffect(() => {
        console.log(userDetails)
        reset({
            fullName : userDetails?.user?.fullName || ""
        })
    }, [reset, userDetails?.user?.fullName])


    return (
        <div><section className="bg-transparent">
            <div className="px-0 mx-auto max-w-2xl">
                <h2 className="mb-4 text-xl font-bold ww-heading">Profile Settings</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="sm:col-span-2">
                            <label htmlFor="fullName" className="ww-label">Full Name</label>
                            <input type="text" id="fullName" className="ww-input" placeholder="Your name" required="" {...register("fullName", { required: true })} />
                        </div>
                        <div className="w-full">
                            <label htmlFor="email" className="ww-label">Email Address</label>
                            <input type="text" id="email" className="ww-input opacity-70" disabled value={userDetails?.user?.email}  />
                        </div>
                        <div className="w-full">
                            <label htmlFor="username" className="ww-label">Username</label>
                            <input type="text" id="username" className="ww-input opacity-70" disabled value={userDetails?.user?.username} />
                        </div>



                    </div>
                    <button type="submit" className="ww-btn-primary mt-6">
                        Save
                    </button>
                </form>
            </div>
            
        </section></div>
    )
}

export default UserEdit
