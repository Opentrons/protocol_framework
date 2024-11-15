import { useEffect, useState } from 'react'

type ResponsiveType = 'xl' | 'lg' | 'md' | 'sm' | 'xs'

const BREAKPOINT_XL_WIDTH = 1440
const BREAKPOINT_LG_WIDTH = 1280
const BREAKPOINT_MD_WIDTH = 1024
const BREAKPOINT_SM_WIDTH = 768
export const useResponsiveBreakpoints = (): ResponsiveType => {
  const [responsiveType, setResponsiveType] = useState<ResponsiveType>('xl')

  useEffect(() => {
    const handleResize = (): void => {
      const width = window.innerWidth
      if (width < BREAKPOINT_SM_WIDTH) {
        setResponsiveType('xs')
      } else if (width < BREAKPOINT_MD_WIDTH) {
        setResponsiveType('sm')
      } else if (width < BREAKPOINT_LG_WIDTH) {
        setResponsiveType('md')
      } else if (width < BREAKPOINT_XL_WIDTH) {
        setResponsiveType('lg')
      } else {
        setResponsiveType('xl')
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return responsiveType
}
