export function Input({ label, name, type = 'text', defaultValue, required = false, step, placeholder }: { label: string, name: string, type?: string, defaultValue?: any, required?: boolean, step?: string, placeholder?: string }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-gray-700">{label}</div>
      <input name={name} type={type} defaultValue={defaultValue} required={required} step={step} placeholder={placeholder}
        className="input" />
    </label>
  )
}

export function Select({ label, name, children, defaultValue, required = false }: { label: string, name: string, children: React.ReactNode, defaultValue?: any, required?: boolean }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-gray-700">{label}</div>
      <select name={name} defaultValue={defaultValue} required={required} className="select">{children}</select>
    </label>
  )
}

export function Textarea({ label, name, defaultValue }: { label: string, name: string, defaultValue?: any }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-gray-700">{label}</div>
      <textarea name={name} defaultValue={defaultValue} rows={4} className="textarea" />
    </label>
  )
}

export function Button({ children, variant = 'primary', className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const base = 'btn'
  const styles = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  return <button className={`${base} ${styles} ${className}`} {...rest}>{children}</button>
}
