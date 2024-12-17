import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'

// Define the shape of the modal manager
interface UseModalManagerReturn {
  isOpen: boolean
  modalContent: ReactNode | null
  openModal: (content: ReactNode) => void
  closeModal: () => void
}

// Custom hook for managing modal state
export const useModalManager = (): UseModalManagerReturn => {
  const [isOpen, setIsOpen] = useState(false)
  const [modalContent, setModalContent] = useState<ReactNode | null>(null)

  const openModal = useCallback((content: ReactNode) => {
    setModalContent(content)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalContent(null)
    setIsOpen(false)
  }, [])

  return { isOpen, modalContent, openModal, closeModal }
}
