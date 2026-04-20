import Head from 'next/head'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminLogin, fetchPendingRegistrations, approveRegistration, rejectRegistration } from '../lib/api'

export default function Admin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null)
  const qc = useQueryClient()

  const { data: pending, refetch } = useQuery(['pending', token], () => fetchPendingRegistrations(token || undefined), {
    enabled: !!token,
  })

  async function login(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await adminLogin(email, password)
      if (res && res.token) {
        setToken(res.token)
        localStorage.setItem('adminToken', res.token)
        qc.invalidateQueries(['pending'])
      }
    } catch (err) {
      alert('Login failed')
    }
  }

  async function handleApprove(id: number) {
    try {
      await approveRegistration(id, token || undefined)
      refetch()
    } catch (err) {
      alert('Approve failed')
    }
  }

  async function handleReject(id: number) {
    try {
      await rejectRegistration(id, token || undefined)
      refetch()
    } catch (err) {
      alert('Reject failed')
    }
  }

  return (
    <>
      <Head>
        <title>SportsApp — Admin</title>
      </Head>
      <main className="min-h-screen p-8">
        <header className="max-w-6xl mx-auto mb-6">
          <h1 className="text-2xl font-bold">Admin — Events</h1>
          <p className="text-sm text-gray-600">Admin console</p>
        </header>

        {!token && (
          <section className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="font-semibold mb-4">Admin Login</h2>
            <form onSubmit={login} className="space-y-3">
              <div>
                <label className="block text-sm">Email</label>
                <input required value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm">Password</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded">Login</button>
              </div>
            </form>
          </section>
        )}

        {token && (
          <section className="max-w-6xl mx-auto bg-white shadow rounded overflow-auto mt-6">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Pending Registrations</h2>
              <div>
                <button className="mr-2 px-3 py-1 bg-gray-200 rounded" onClick={() => { localStorage.removeItem('adminToken'); setToken(null) }}>Logout</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => refetch()}>Refresh</button>
              </div>
            </div>

            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Event</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(pending) && pending.length === 0 && (
                  <tr><td className="p-4">No pending registrations</td></tr>
                )}
                {Array.isArray(pending) && pending.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.id}</td>
                    <td className="p-3">{r.user_name}</td>
                    <td className="p-3">{r.user_email}</td>
                    <td className="p-3">{r.event_title}</td>
                    <td className="p-3">{r.registration_date}</td>
                    <td className="p-3">
                      <button className="mr-2 px-2 py-1 bg-green-600 text-white rounded" onClick={() => handleApprove(r.id)}>Approve</button>
                      <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => handleReject(r.id)}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </>
  )
}
