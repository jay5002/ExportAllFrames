import { useCallback, useEffect, useState } from 'react'
import { backend } from './backend'
import type { StudentNotification } from './types'

const changedEvent = 'skillverse:notifications-changed'

export default function useStudentNotifications(enabled = true) {
  const [items, setItems] = useState<StudentNotification[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')
  const [legacy, setLegacy] = useState(false)
  const reload = useCallback(async () => {
    if (!enabled) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      setItems(await backend<StudentNotification[]>('/notifications'))
      setLegacy(false)
    } catch (failure) {
      if (failure instanceof Error && failure.message.includes('API endpoint not found')) {
        try {
          const [messages, workspace, assignments] = await Promise.all([
            backend<{ id: string; author: string; audience: string; body: string; createdAt: string; read: boolean }[]>('/messages'),
            backend<{ submissions: { id: string; assignment: string; course: string; status: string; score?: number; feedback?: string; submitted: string }[] }>('/workspace?view=learning'),
            backend<{ id: string; title: string; course: string; dueDate: string }[]>('/assignments'),
          ])
          setItems([
            ...messages.map(item => ({ id: item.id, type: 'announcement' as const, title: `Announcement from ${item.author}`, body: item.body, context: item.audience, occurredAt: item.createdAt, href: '/notifications', read: item.read })),
            ...assignments.map(item => ({ id: item.id, type: 'assignment' as const, title: `Assignment available: ${item.title}`, body: `${item.course} · Due ${item.dueDate}`, context: item.course, occurredAt: item.dueDate, href: '/assignments', read: true })),
            ...workspace.submissions.filter(item => item.status === 'Graded').map(item => ({ id: item.id, type: 'grade' as const, title: `${item.assignment} graded`, body: `${item.score}/100${item.feedback ? ` · ${item.feedback}` : ''}`, context: item.course, occurredAt: item.submitted, href: '/assignments', read: true })),
          ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)))
          setLegacy(true)
        } catch (fallbackFailure) {
          setError(fallbackFailure instanceof Error ? fallbackFailure.message : 'Unable to load notifications')
        }
      } else {
        setError(failure instanceof Error ? failure.message : 'Unable to load notifications')
      }
    } finally {
      setLoading(false)
    }
  }, [enabled])
  useEffect(() => {
    void reload()
    const refresh = () => void reload()
    window.addEventListener(changedEvent, refresh)
    return () => window.removeEventListener(changedEvent, refresh)
  }, [reload])
  const markRead = async (item: StudentNotification) => {
    setError('')
    try {
      const updated = legacy && item.type === 'announcement'
        ? { ...item, ...(await backend<{ read: boolean }>(`/messages/${encodeURIComponent(item.id)}`, 'PUT', {})) }
        : await backend<StudentNotification>(`/notifications/${item.type}/${encodeURIComponent(item.id)}`, 'PUT', {})
      setItems(current => current.map(record => record.type === updated.type && record.id === updated.id ? updated : record))
      window.dispatchEvent(new Event(changedEvent))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to mark notification as read')
    }
  }
  return { items, unread: items.filter(item => !item.read).length, loading, error, legacy, reload, markRead }
}
