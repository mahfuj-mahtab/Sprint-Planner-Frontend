import React, { useState } from 'react'
import { useForm } from "react-hook-form"

function OrgCreate({ onClose }) {
  const [orgName, setOrgName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Org Name:', orgName)
    console.log('Description:', description)
    // Reset form
    setOrgName('')
    setDescription('')
    // Close modal
    onClose()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">Create Organization</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name
          </label>
          <input
            type="text"
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Organization
        </button>
      </form>
    </div>
  )
}

export default OrgCreate
