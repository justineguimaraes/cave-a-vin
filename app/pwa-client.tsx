'use client'

import { useEffect } from 'react'
import { registerSW } from './service-worker-registration'

export function PWAClient() {
  useEffect(() => {
    registerSW()
  }, [])
  return null
}