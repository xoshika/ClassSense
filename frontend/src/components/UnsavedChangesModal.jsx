import { createPortal } from 'react-dom'

export default function UnsavedChangesModal({ onConfirm, onCancel }) {
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Unsaved Changes</h2>
        <p className="text-sm text-gray-600 mb-6">You have an active class session. Leaving now will discard all progress.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg">Leave Anyway</button>
        </div>
      </div>
    </div>,
    document.body
  )
}