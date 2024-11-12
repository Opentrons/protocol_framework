import { useEffect, useState } from 'react'

export function useIsDeckSetupWindowSizeSmall(): boolean {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = (): void => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  const tooSmall = windowSize.width < 1433
  return tooSmall
}
