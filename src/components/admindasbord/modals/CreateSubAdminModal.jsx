import React from 'react'
import CreateAdminBaseModal from './CreateAdminBaseModal.jsx'

const CreateSubAdminModal = ({ isOpen, onClose, onSubmit, editData = null, mode = 'create' }) => {
  return (
    <CreateAdminBaseModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      editData={editData}
      mode={mode}
      title={{
        edit: 'सब ऐडमिन संपादित करें',
        create: 'नया सब ऐडमिन'
      }}
      subtitle={{
        edit: 'Edit Sub-Admin',
        create: 'Create New Sub-Admin'
      }}
      submitButtonText={{
        edit: 'अपडेट करें',
        create: 'सब ऐडमिन बनाएं'
      }}
      inputId="subadmin-photo-upload"
      namePlaceholder="Enter sub-admin name"
      extraPayload={{ booth_javabdari: '0' }}
    />
  )
}

export default CreateSubAdminModal


