"use client"

type Props = {
  className?: string
  children?: React.ReactNode
}

export default function PrintButton({ className, children }: Props) {
  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') window.print()
      }}
      className={className}
    >
      {children ?? 'Print / Download PDF'}
    </button>
  )
}

