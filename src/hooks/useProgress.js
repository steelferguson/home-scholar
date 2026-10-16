import { createContext, useContext } from 'react'

export const ProgressContext = createContext(null)

export function useProgress() {
  return useContext(ProgressContext)
}
