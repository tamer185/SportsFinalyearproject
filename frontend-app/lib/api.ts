import axios from 'axios'
import sportsEventsData from '../src/data'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000',
  timeout: 5000,
})

export async function fetchEvents() {
  try {
    const res = await api.get('/api/events')
    if (res.data && res.data.success) return res.data.events
    if (res.data && Array.isArray(res.data.events)) return res.data.events
  } catch (err) {
    // fallthrough to local data
  }
  return sportsEventsData
}

export default api

export async function registerForEvent(eventId: number | string, name: string, email: string) {
  const res = await api.post(`/api/register/${eventId}`, { name, email })
  return res.data
}

export async function adminLogin(email: string, password: string) {
  const res = await api.post('/api/admin/login', { email, password })
  return res.data
}

export async function fetchPendingRegistrations(token?: string) {
  const headers: any = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await api.get('/api/admin/pending-registrations', { headers })
  return res.data.registrations || res.data.registrations
}

export async function approveRegistration(id: number | string, token?: string) {
  const headers: any = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await api.put(`/api/admin/approve-registration/${id}`, {}, { headers })
  return res.data
}

export async function rejectRegistration(id: number | string, token?: string) {
  const headers: any = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await api.put(`/api/admin/reject-registration/${id}`, {}, { headers })
  return res.data
}
