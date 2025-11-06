import React from 'react'
import CreateAdminBaseModal from './CreateAdminBaseModal.jsx'

const CreateAdminModal = ({ isOpen, onClose, onSubmit, editData = null, mode = 'create' }) => {
  return (
    <CreateAdminBaseModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      editData={editData}
      mode={mode}
      title={{
        edit: 'ऐडमिन संपादित करें',
        create: 'नया ऐडमिन'
      }}
      subtitle={{
        edit: 'Edit Admin',
        create: 'Create New Admin'
      }}
      submitButtonText={{
        edit: 'अपडेट करें',
        create: 'ऐडमिन बनाएं'
      }}
      inputId="photo-upload"
      namePlaceholder="Enter admin name"
    />
  )
}

export default CreateAdminModal


