export function Input({ label, name, type = 'text', defaultValue, required = false, step }: { label: string, name: string, type?: string, defaultValue?: any, required?: boolean, step?: string }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      <input name={name} type={type} defaultValue={defaultValue} required={required} step={step}
        className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-brand" />
    </label>
  )
}

export function Select({ label, name, children, defaultValue, required = false }: { label: string, name: string, children: React.ReactNode, defaultValue?: any, required?: boolean }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      <select name={name} defaultValue={defaultValue} required={required}
        className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-brand">{children}</select>
    </label>
  )
}

export function Textarea({ label, name, defaultValue }: { label: string, name: string, defaultValue?: any }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      <textarea name={name} defaultValue={defaultValue} rows={4}
        className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-brand" />
    </label>
  )
}

export function Button({ children, variant = 'primary', className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium'
  const styles = variant === 'primary' ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  return <button className={`${base} ${styles} ${className}`} {...rest}>{children}</button>
}

