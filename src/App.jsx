import { useEffect, useMemo, useState } from 'react'

function Stat({ label, value, suffix }) {
  return (
    <div className="rounded-xl bg-white/70 backdrop-blur p-4 shadow border border-white/50">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-800">{value}{suffix || ''}</div>
    </div>
  )
}

function Section({ title, children, actions }) {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur border border-white/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  )
}

export default function App() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])
  const [active, setActive] = useState('overview')
  const [userId, setUserId] = useState('demo-user-1')

  // Health inputs
  const [metric, setMetric] = useState({ steps: '', sleep_hours: '', heart_rate_avg: '', calories_in: '', calories_out: '' })
  const [daily, setDaily] = useState(null)

  // Schedule inputs
  const [sched, setSched] = useState({ type: 'meeting', title: '', start_time: '', location: '' })
  const [scheduleList, setScheduleList] = useState([])

  // Prayer
  const [city, setCity] = useState('Jakarta')
  const [prayers, setPrayers] = useState(null)

  // Maps
  const [lat, setLat] = useState(-6.200000)
  const [lng, setLng] = useState(106.816666)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  useEffect(() => {
    fetchDaily()
    fetchSchedule()
    fetchPrayers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchDaily(dateStr = today) {
    try {
      const res = await fetch(`${baseUrl}/api/insights/daily?user_id=${encodeURIComponent(userId)}&day=${dateStr}`)
      const data = await res.json()
      setDaily(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchSchedule() {
    try {
      const res = await fetch(`${baseUrl}/api/schedule?user_id=${encodeURIComponent(userId)}&day=${today}`)
      const data = await res.json()
      setScheduleList(data.items || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchPrayers() {
    try {
      const res = await fetch(`${baseUrl}/api/prayer-times?city=${encodeURIComponent(city)}&date_str=${today}`)
      const data = await res.json()
      setPrayers(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function addMetric() {
    const payload = { user_id: userId }
    for (const [k, v] of Object.entries(metric)) {
      if (v !== '') payload[k] = Number(v)
    }
    try {
      await fetch(`${baseUrl}/api/metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      await fetchDaily()
      setMetric({ steps: '', sleep_hours: '', heart_rate_avg: '', calories_in: '', calories_out: '' })
    } catch (e) { console.error(e) }
  }

  async function addSchedule() {
    const payload = {
      user_id: userId,
      type: sched.type,
      title: sched.title || `${sched.type} plan`,
      start_time: new Date(sched.start_time).toISOString(),
      location: sched.location || undefined,
    }
    try {
      await fetch(`${baseUrl}/api/schedule`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      await fetchSchedule()
      setSched({ type: 'meeting', title: '', start_time: '', location: '' })
    } catch (e) { console.error(e) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-fuchsia-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">AI Health Assistant</h1>
            <p className="text-gray-600">Terhubung ke smartwatch • Analitik kesehatan • Jadwal pintar</p>
          </div>
          <div className="flex items-center gap-2">
            <input value={userId} onChange={e => setUserId(e.target.value)} className="px-3 py-2 rounded-lg border bg-white/70" />
            <span className="text-sm text-gray-500">User ID</span>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 mb-6">
          {['overview','schedule','health','prayer','maps'].map(t => (
            <button key={t} onClick={() => setActive(t)} className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm transition ${active===t? 'bg-blue-600 text-white' : 'bg-white/80 hover:bg-white'}`}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </nav>

        {active === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat label="Langkah Hari Ini" value={daily?.steps ?? '—'} />
            <Stat label="Tidur" value={daily?.sleep_hours ?? '—'} suffix=" jam" />
            <Stat label="HR Avg" value={daily?.heart_rate_avg ?? '—'} suffix=" bpm" />
            <Section title="Insight Harian" >
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                {(daily?.advice || []).map((a, i) => (<li key={i}>{a}</li>))}
                {(!daily || (daily?.advice||[]).length===0) && <li>Belum ada data. Tambahkan metrik di tab Health.</li>}
              </ul>
            </Section>
            <Section title="Agenda Hari Ini" actions={<button onClick={() => setActive('schedule')} className="text-sm text-blue-600">Kelola</button>}>
              <div className="space-y-2">
                {scheduleList.length === 0 ? (
                  <p className="text-gray-500">Belum ada jadwal untuk hari ini.</p>
                ) : scheduleList.map((s) => (
                  <div key={s._id} className="p-3 rounded-lg bg-gray-50 border">
                    <div className="text-sm text-gray-500">{new Date(s.start_time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} • {s.type}</div>
                    <div className="font-medium">{s.title}</div>
                    {s.location && <div className="text-sm text-gray-600">{s.location}</div>}
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Waktu Sholat" actions={<button onClick={fetchPrayers} className="text-sm text-blue-600">Refresh</button>}>
              <div className="flex items-center gap-2 mb-3">
                <input className="px-3 py-2 rounded-lg border bg-white/70" value={city} onChange={e=>setCity(e.target.value)} />
                <button onClick={fetchPrayers} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Cari</button>
              </div>
              {prayers ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-gray-800">
                  {Object.entries(prayers.times || {}).map(([k,v]) => (
                    <div key={k} className="p-3 rounded-lg bg-gray-50 border flex items-center justify-between"><span className="text-gray-600">{k}</span><span className="font-semibold">{v}</span></div>
                  ))}
                </div>
              ) : <p className="text-gray-500">Memuat...</p>}
            </Section>
          </div>
        )}

        {active === 'schedule' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Section title="Buat Jadwal">
              <div className="space-y-3">
                <select className="w-full px-3 py-2 rounded-lg border" value={sched.type} onChange={e=>setSched(s=>({...s, type: e.target.value}))}>
                  {['meeting','meal','workout','fasting','prayer','other'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <input className="w-full px-3 py-2 rounded-lg border" placeholder="Judul" value={sched.title} onChange={e=>setSched(s=>({...s, title: e.target.value}))} />
                <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border" value={sched.start_time} onChange={e=>setSched(s=>({...s, start_time: e.target.value}))} />
                <input className="w-full px-3 py-2 rounded-lg border" placeholder="Lokasi (opsional)" value={sched.location} onChange={e=>setSched(s=>({...s, location: e.target.value}))} />
                <button onClick={addSchedule} className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white">Simpan</button>
              </div>
            </Section>
            <div className="md:col-span-2">
              <Section title="Agenda Hari Ini" actions={<button onClick={fetchSchedule} className="text-sm text-blue-600">Refresh</button>}>
                <div className="space-y-2">
                  {scheduleList.length === 0 ? (
                    <p className="text-gray-500">Belum ada jadwal hari ini.</p>
                  ) : scheduleList.map((s) => (
                    <div key={s._id} className="p-3 rounded-lg bg-gray-50 border flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">{new Date(s.start_time).toLocaleString()}</div>
                        <div className="font-medium">{s.title} <span className="text-xs text-gray-500">• {s.type}</span></div>
                        {s.location && <div className="text-sm text-gray-600">{s.location}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        )}

        {active === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Section title="Tambah Metrik Kesehatan">
              <div className="grid grid-cols-2 gap-3">
                <input className="px-3 py-2 rounded-lg border" placeholder="Langkah" value={metric.steps} onChange={e=>setMetric(m=>({...m, steps: e.target.value}))} />
                <input className="px-3 py-2 rounded-lg border" placeholder="Tidur (jam)" value={metric.sleep_hours} onChange={e=>setMetric(m=>({...m, sleep_hours: e.target.value}))} />
                <input className="px-3 py-2 rounded-lg border" placeholder="HR avg" value={metric.heart_rate_avg} onChange={e=>setMetric(m=>({...m, heart_rate_avg: e.target.value}))} />
                <input className="px-3 py-2 rounded-lg border" placeholder="Kalori masuk" value={metric.calories_in} onChange={e=>setMetric(m=>({...m, calories_in: e.target.value}))} />
                <input className="px-3 py-2 rounded-lg border" placeholder="Kalori keluar" value={metric.calories_out} onChange={e=>setMetric(m=>({...m, calories_out: e.target.value}))} />
              </div>
              <button onClick={addMetric} className="mt-4 w-full px-3 py-2 rounded-lg bg-blue-600 text-white">Simpan</button>
            </Section>
            <div className="md:col-span-2">
              <Section title="Ringkasan Hari Ini" actions={<button onClick={()=>fetchDaily()} className="text-sm text-blue-600">Refresh</button>}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Langkah" value={daily?.steps ?? '—'} />
                  <Stat label="Tidur" value={daily?.sleep_hours ?? '—'} suffix=" jam" />
                  <Stat label="HR Avg" value={daily?.heart_rate_avg ?? '—'} suffix=" bpm" />
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Saran</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    {(daily?.advice || []).map((a, i) => (<li key={i}>{a}</li>))}
                  </ul>
                </div>
              </Section>
            </div>
          </div>
        )}

        {active === 'prayer' && (
          <div className="grid grid-cols-1 gap-4">
            <Section title="Waktu Sholat" actions={<button onClick={fetchPrayers} className="text-sm text-blue-600">Refresh</button>}>
              <div className="flex items-center gap-2 mb-3">
                <input className="px-3 py-2 rounded-lg border bg-white/70" value={city} onChange={e=>setCity(e.target.value)} />
                <button onClick={fetchPrayers} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Cari</button>
              </div>
              {prayers ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-gray-800">
                  {Object.entries(prayers.times || {}).map(([k,v]) => (
                    <div key={k} className="p-3 rounded-lg bg-gray-50 border flex items-center justify-between"><span className="text-gray-600">{k}</span><span className="font-semibold">{v}</span></div>
                  ))}
                </div>
              ) : <p className="text-gray-500">Memuat...</p>}
            </Section>
          </div>
        )}

        {active === 'maps' && (
          <div className="grid grid-cols-1 gap-4">
            <Section title="Lokasi & Peta">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <input className="px-3 py-2 rounded-lg border w-36" value={lat} onChange={e=>setLat(e.target.value)} />
                <input className="px-3 py-2 rounded-lg border w-36" value={lng} onChange={e=>setLng(e.target.value)} />
              </div>
              <div className="aspect-video w-full overflow-hidden rounded-xl border">
                <iframe
                  title="map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps?q=${lat},${lng}&z=14&output=embed`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Untuk integrasi penuh Google Maps SDK & navigasi smartwatch, tambahkan API resmi sesuai kebutuhan.</p>
            </Section>
          </div>
        )}

        <footer className="mt-10 text-center text-sm text-gray-500">v0.1 • Demo UI modern</footer>
      </div>
    </div>
  )
}
