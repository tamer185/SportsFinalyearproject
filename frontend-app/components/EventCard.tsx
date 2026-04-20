import Image from 'next/image'
import { useState } from 'react'
import { SportsEvent } from '../src/data'
import { registerForEvent } from '../lib/api'

type Props = {
  event: SportsEvent
}

export default function EventCard({ event }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await registerForEvent(event.id, name, email)
      setStatus(res && res.success ? 'success' : 'ok')
    } catch (err: any) {
      setStatus('error')
    }
  }

  return (
    <article className="bg-white rounded shadow overflow-hidden">
      <div className="relative h-48 w-full">
        <img src={event.image} alt={event.title} className="object-cover w-full h-48" />
      </div>
      <div className="p-4">
        <h2 className="text-lg font-semibold">{event.title}</h2>
        <p className="text-sm text-gray-500">{event.location} • {event.category}</p>
        <p className="mt-2 text-sm text-gray-700">{event.description}</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium">{event.priceDisplay}</span>
          <span className="text-gray-500">{event.date} • {event.time}</span>
        </div>

        <div className="mt-3">
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={() => setShowForm(s => !s)}
          >
            {showForm ? 'Close' : 'Register'}
          </button>

          {showForm && (
            <form onSubmit={submit} className="mt-3 space-y-2">
              <div>
                <label className="block text-sm">Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">Submit</button>
                {status === 'submitting' && <span className="text-sm text-gray-500">Submitting…</span>}
                {status === 'success' && <span className="text-sm text-green-600">Registered — pending approval</span>}
                {status === 'error' && <span className="text-sm text-red-600">Registration failed</span>}
              </div>
            </form>
          )}
        </div>
      </div>
    </article>
  )
}
