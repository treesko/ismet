import React from 'react'

type Column<T> = {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
}

export default function DataTable<T extends { id?: number | string }>({ columns, data }: { columns: Column<T>[], data: T[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="px-3 py-2 text-left font-medium">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((row, idx) => (
            <tr key={row.id ?? idx} className="hover:bg-gray-50">
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2 whitespace-nowrap">
                  {c.render ? c.render(row) : String((row as any)[c.key])}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={columns.length}>S’ka të dhëna</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
