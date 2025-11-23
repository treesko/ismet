"use client"
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)
  useEffect(() => {
    setMounted(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const isDark = saved ? saved === 'dark' : false
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }
  if (!mounted) return null
  return (
    <button onClick={toggle} className="rounded-md border px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800" aria-label="Toggle theme">
      {dark ? '🌙' : '☀️'}
    </button>
  )
}

