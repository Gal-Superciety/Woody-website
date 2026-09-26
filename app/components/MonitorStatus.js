'use client';
export default function MonitorStatus({ status, updatedAt, refreshing, refresh }) {
  const label = status === 'live' ? 'Live data' : status === 'loading' ? 'Connecting' : 'Data unavailable';
  return <div className="monitor-status" role="status">
    <span className={`feed-state ${status}`}><span aria-hidden="true" />{label}</span>
    {updatedAt && <time dateTime={new Date(updatedAt * 1000).toISOString()}>Updated {new Date(updatedAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>}
    <button type="button" onClick={refresh} disabled={refreshing} className="refresh-feed">{refreshing ? 'Refreshing…' : 'Refresh ↻'}</button>
  </div>;
}
