import { useState, useEffect } from 'react'

const BREAKPOINT_HEIGHT = 650
const BREAKPOINT_WIDTH = 768

export const useScreenSizeCheck = (): boolean => {
  const [isValidSize, setValidSize] = useState<boolean>(
    window.screen.width > BREAKPOINT_WIDTH &&
      window.screen.height > BREAKPOINT_HEIGHT
  )

  useEffect(() => {
    const handleResize = (): void => {
      // delete this before merging, this is for debugging
      console.log(window.screen.width)
      console.log(window.screen.height)
      setValidSize(
        window.screen.width > BREAKPOINT_WIDTH &&
          window.screen.height > BREAKPOINT_HEIGHT
      )
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return isValidSize
}
