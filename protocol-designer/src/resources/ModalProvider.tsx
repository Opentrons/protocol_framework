import { createContext, useContext } from 'react'
import { useModalManager } from './useModalManager'
import type { ReactNode } from 'react'

interface ModalProviderProps {
  children: ReactNode
}

// Create a context with inferred types
const ModalContext = createContext<ReturnType<typeof useModalManager> | null>(
  null
)

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const modalManager = useModalManager()

  return (
    <ModalContext.Provider value={modalManager}>
      {children}
      {modalManager.isOpen && (
        <div className="modal-overlay" onClick={modalManager.closeModal}>
          <div
            className="modal-content"
            onClick={e => {
              e.stopPropagation()
            }}
          >
            {modalManager.modalContent}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

// Hook to access modal context
export const useModal = (): ReturnType<typeof useModalManager> => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
