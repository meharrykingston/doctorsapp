import { AppIcon } from '../../components/ui/icons'
import type { AppRoute } from '../../types/routes'
import './splash.css'

type SplashProps = {
  onNavigate: (route: AppRoute) => void
}

function Splash({ onNavigate }: SplashProps) {
  return (
    <section className="splash-page">
      <div className="splash-card">
        <span className="splash-mark"><AppIcon name="sparkles" className="splash-icon" /></span>
        <h1>Doctor App</h1>
        <p>Care, without chaos.</p>
        <button type="button" onClick={() => onNavigate('login')}>
          Get Started
          <AppIcon name="arrow-left" className="btn-icon" />
        </button>
      </div>
    </section>
  )
}

export default Splash
