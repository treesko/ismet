"use client"
import React from 'react'

export default function ConfirmSubmit(
  { message, children, className, ...props }:
  { message: string, children: React.ReactNode, className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      {...props}
    >
      {children}
    </button>
  )
}
