import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Upload, FileText, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3002'

interface Document {
  id: string
  title: string
  filename: string
  created_at: string
}

export default function DocumentsPage() {
  const token = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const fetchDocuments = useCallback(async () => {
    if (!token) return
    const res = await fetch(`${API_URL}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setDocuments(await res.json())
  }, [token])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !token) return
    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('title', title.trim() || file.name)
    formData.append('file', file)

    try {
      const res = await fetch(`http://localhost:3002/ingestion/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (res.ok) {
        setTitle('')
        setFile(null)
        await fetchDocuments()
      } else {
        const body = await res.json().catch(() => ({})) as { detail?: string }
        setError(body.detail ?? 'Upload failed. Please try again.')
      }
    } catch {
      setError('Network error — check your connection.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!token) return
    setDocuments(prev => prev.filter(d => d.id !== id))
    await fetch(`${API_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-6 py-4 backdrop-blur-sm">
        <Link to="/chat">
          <button className="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100">
            <ArrowLeft className="size-4" />
          </button>
        </Link>
        <h1 className="text-base font-semibold text-zinc-100">Documents</h1>
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-6 md:px-6 md:py-8">

        {/* Upload card */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600">
            Upload Document
          </h2>

          <form
            onSubmit={handleUpload}
            className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:p-5"
          >
            {/* Title input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter a title (defaults to filename)"
                className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus-visible:border-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              />
            </div>

            {/* Drop zone */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">
                File
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={[
                  'relative rounded-xl border-2 border-dashed transition-colors',
                  dragging
                    ? 'border-blue-500 bg-blue-500/5'
                    : file
                    ? 'border-emerald-600/50 bg-emerald-950/20'
                    : 'border-zinc-700 hover:border-zinc-600',
                ].join(' ')}
              >
                <input
                  type="file"
                  required
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="pointer-events-none flex flex-col items-center justify-center gap-2.5 px-4 py-8 text-center">
                  {file ? (
                    <>
                      <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-950/50 border border-emerald-800/50">
                        <CheckCircle2 className="size-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{file.name}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{formatSize(file.size)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800">
                        <Upload className="size-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-300">
                          Drop a file or click to browse
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-600">PDF, DOCX, TXT and more</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2.5 text-sm text-red-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Upload className="size-4" />
              {uploading ? 'Uploading…' : 'Upload Document'}
            </button>
          </form>
        </section>

        {/* Documents list */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600">
            Documents ({documents.length})
          </h2>

          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 px-6 py-14 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <FileText className="size-6 text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-400">No documents uploaded yet</p>
              <p className="mt-1 text-xs text-zinc-600">
                Upload a document above to get started
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {documents.map(doc => (
                <li
                  key={doc.id}
                  className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-colors hover:border-zinc-700"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800">
                    <FileText className="size-5 text-blue-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{doc.title}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {doc.filename} · {formatDate(doc.created_at)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-950/50 hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
