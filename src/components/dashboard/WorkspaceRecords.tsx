import { Link } from 'react-router-dom'
import useStudentNotifications from '../../lib/useStudentNotifications'

export default function WorkspaceRecords() {
  const { items, unread, loading, error, legacy, reload, markRead } = useStudentNotifications(true)
  return <section className="sv-card sv-card-pad" aria-busy={loading}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><div className="flex flex-wrap items-center gap-2"><h2 className="sv-section-title">Your notifications</h2>{unread > 0 && <span className="sv-badge">{unread} unread</span>}</div>
        <p className="sv-meta mt-1">Instructor announcements, assignment updates, and published grades for your enrolled courses.</p></div>
      <button disabled={loading} onClick={() => void reload()} className="sv-btn-secondary">Refresh</button>
    </div>
    {loading && <p role="status" className="sv-state mt-4">Loading notifications…</p>}
    {error && <div role="alert" className="sv-alert sv-alert-error mt-4">{error}<button className="sv-link ml-2" onClick={() => void reload()}>Retry</button></div>}
    {legacy && <p className="sv-meta mt-4">Announcements use saved read status. Assignment and grade read status requires the latest notification API deployment.</p>}
    {!loading && !error && <div className="mt-4">
      {items.length === 0 && <p className="sv-empty">No notifications yet. Updates from your instructors will appear here.</p>}
      {items.map(item => <article key={`${item.type}:${item.id}`} className="border-t border-slate-100 py-4 first:border-t-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>{!item.read && <span className="sv-badge">New</span>}</div>
            <p className="sv-meta mt-1">{item.context} · {new Date(item.occurredAt).toLocaleString()}</p></div>
          <span className={`sv-badge ${item.type === 'grade' ? 'sv-badge-success' : item.type === 'assignment' ? 'sv-badge-warn' : ''}`}>{item.type === 'grade' ? 'Grade' : item.type === 'assignment' ? 'Assignment' : 'Announcement'}</span>
        </div>
        <p className="sv-desc mt-3 max-w-[75ch] whitespace-pre-wrap break-words">{item.body}</p>
        <div className="mt-2 flex flex-wrap gap-2"><Link className="sv-link -ml-2" to={item.href}>{item.type === 'announcement' ? 'View details' : 'Open assignment'}</Link>
          <button disabled={item.read} className="sv-link disabled:text-slate-500" onClick={() => void markRead(item)}>{item.read ? 'Read' : 'Mark as read'}</button></div>
      </article>)}
    </div>}
  </section>
}
