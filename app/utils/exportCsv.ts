// Plain CSV — opens directly in Excel, no extra dependency needed for an
// "export to Excel" button.
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (cell: string | number) => {
    const text = String(cell)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [headers, ...rows].map(row => row.map(escapeCell).join(','))
  // Leading BOM so Excel opens UTF-8 (non-ASCII robot/unit names, etc.) correctly.
  const csv = `﻿${lines.join('\r\n')}`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
