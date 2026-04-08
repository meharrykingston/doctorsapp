import type { CSSProperties } from 'react'
import { AppIcon } from '../../components/ui/icons'
import type { AppRoute } from '../../types/routes'
import './wallet.css'

type WalletProps = {
  onNavigate: (route: AppRoute) => void
}

const slabs = [
  { title: 'Slab 1', state: 'Current', target: 'Complete 5 paid consultations', amount: '?5,000' },
  { title: 'Slab 2', state: 'Locked', target: 'Complete 10 paid consultations', amount: '?10,000' },
  { title: 'Slab 3', state: 'Locked', target: 'Complete 15 paid consultations', amount: '?15,000' },
]

const transactions = [
  { title: 'Consultation - Rajesh Sharma', date: '2/26/2026', amount: '+?500', status: 'Completed', type: 'credit' },
  { title: 'Video Consultation - Priya Patel', date: '2/26/2026', amount: '+?750', status: 'Completed', type: 'credit' },
  { title: 'Medical Equipment Purchase', date: '2/25/2026', amount: '-?2500', status: 'Completed', type: 'debit' },
  { title: 'Consultation - Amit Kumar', date: '2/25/2026', amount: '+?600', status: 'Completed', type: 'credit' },
  { title: 'Follow-up - Sneha Reddy', date: '2/24/2026', amount: '+?800', status: 'Pending', type: 'credit' },
]

function Wallet({ onNavigate }: WalletProps) {
  return (
    <section className="wallet-page">
      <header className="wallet-header">
        <div className="wallet-topbar">
          <button type="button" className="bar-icon" aria-label="back" onClick={() => onNavigate('dashboard')}><AppIcon name="arrow-left" className="bar-svg" /></button>
          <h1>Wallet</h1>
          <div className="bar-right">
            <button type="button" className="bar-icon" aria-label="search"><AppIcon name="search" className="bar-svg" /></button>
            <button type="button" className="bar-icon" aria-label="notifications"><AppIcon name="bell" className="bar-svg" /><span className="dot">3</span></button>
          </div>
        </div>

        <div className="balance-head card-rise" style={{ '--d': '0ms' } as CSSProperties}>
          <p>Total Balance</p>
          <h2>?7,500</h2>
          <div className="split-cards">
            <article><span><AppIcon name="lock" className="tiny" /> Available</span><strong>?2,500</strong></article>
            <article><span><AppIcon name="lock" className="tiny" /> Locked</span><strong>?5,000</strong></article>
          </div>
        </div>
      </header>

      <main className="wallet-content">
        <section className="section card-rise" style={{ '--d': '45ms' } as CSSProperties}>
          <h3><AppIcon name="gift" className="tiny" /> Joining Benefit - Slab 1</h3>
          <p>Complete consultations to unlock benefits</p>
          <div className="progress-row"><span>Progress</span><strong>3 / 5 consultations</strong></div>
          <div className="track"><i /></div>
          <p>2 more paid consultations to unlock 5,000</p>
        </section>

        <section className="earning card-rise" style={{ '--d': '80ms' } as CSSProperties}>
          <div><p>Total Earnings</p><h3>?45,00</h3><span>This month</span></div>
          <span className="earning-dot"><AppIcon name="trend" className="small" /></span>
        </section>

        <section className="card-rise" style={{ '--d': '115ms' } as CSSProperties}>
          <h3 className="sub-title">Benefit Slabs</h3>
          <div className="slab-list">
            {slabs.map((slab) => (
              <article key={slab.title} className={`slab-card ${slab.state === 'Current' ? 'active' : ''}`}>
                <div className="slab-head"><h4>{slab.title}</h4><span className={`pill ${slab.state.toLowerCase()}`}>{slab.state}</span><AppIcon name="lock" className="tiny" /></div>
                <p>{slab.target}</p>
                <strong>{slab.amount}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="card-rise" style={{ '--d': '150ms' } as CSSProperties}>
          <h3 className="sub-title">Transactions</h3>
          <div className="tabs"><button type="button" className="tab active">All</button><button type="button" className="tab">Credits</button><button type="button" className="tab">Debits</button></div>
          <div className="tx-list">
            {transactions.map((tx, idx) => (
              <article key={`${tx.title}-${idx}`} className="tx-card">
                <span className={`tx-icon ${tx.type}`}><AppIcon name="trend" className="small" /></span>
                <div className="tx-main"><h4>{tx.title}</h4><p><AppIcon name="calendar" className="tiny" /> {tx.date} <span className={`status ${tx.status.toLowerCase()}`}>{tx.status}</span></p></div>
                <strong className={tx.type}>{tx.amount}</strong>
              </article>
            ))}
          </div>
        </section>
      </main>

      <button type="button" className="fab-btn" aria-label="go store" onClick={() => onNavigate('store')}><AppIcon name="plus" className="fab-icon" /></button>

      <nav className="bottom-nav">
        <button type="button" className="nav-item" onClick={() => onNavigate('dashboard')}><AppIcon name="home" className="nav-svg" /><span>Home</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('patients')}><AppIcon name="patients" className="nav-svg" /><span>Patients</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('appointments')}><AppIcon name="calendar" className="nav-svg" /><span>Appointments</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('freelance-cases')}><AppIcon name="sparkles" className="nav-svg" /><span>Explore</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('store')}><AppIcon name="store" className="nav-svg" /><span>Store</span></button>
      </nav>
    </section>
  )
}

export default Wallet


