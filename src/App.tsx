import { useState } from 'react'
import Appointments from './pages/appointments/appointments'
import AiAssistant from './pages/ai-assistant/ai-assistant'
import Dashboard from './pages/dashboard/dashboard'
import Learning from './pages/learning/learning'
import DoctorLogin from './pages/onboarding/login'
import IdentityVerification from './pages/onboarding/identity-verification'
import PracticeAvailability from './pages/onboarding/practice-availability'
import ProfessionalDetails from './pages/onboarding/professional-details'
import DoctorRegistration from './pages/onboarding/registration'
import VerificationPending from './pages/onboarding/verification-pending'
import DoctorNotifications from './pages/notifications/notifications'
import FreelanceCases from './pages/freelance/freelance'
import Patients from './pages/patients/patients'
import Settings from './pages/settings/settings'
import Splash from './pages/splash/splash'
import Store from './pages/store/store'
import TeleconsultOverview from './pages/teleconsult-overview/teleconsult-overview'
import TeleconsultPrescription from './pages/teleconsult-prescription/teleconsult-prescription'
import TeleconsultRoom from './pages/teleconsult-room/teleconsult-room'
import Wallet from './pages/wallet/wallet'
import type { AppRoute } from './types/routes'
import { getDoctorSession } from './services/authApi'
import InstallPrompt from './app/InstallPrompt'
import './App.css'

function App() {
  const initialRoute: AppRoute = getDoctorSession() ? 'dashboard' : 'login'
  const [route, setRoute] = useState<AppRoute>(initialRoute)

  return (
    <main className="app">
      <div className="app-screen" key={route}>
        {route === 'splash' && <Splash onNavigate={setRoute} />}
        {route === 'login' && <DoctorLogin onNavigate={setRoute} />}
        {route === 'registration' && <DoctorRegistration onNavigate={setRoute} />}
        {route === 'identity-verification' && <IdentityVerification onNavigate={setRoute} />}
        {route === 'professional-details' && <ProfessionalDetails onNavigate={setRoute} />}
        {route === 'practice-availability' && <PracticeAvailability onNavigate={setRoute} />}
        {route === 'verification-pending' && <VerificationPending onNavigate={setRoute} />}
        {route === 'dashboard' && <Dashboard onNavigate={setRoute} />}
        {route === 'wallet' && <Wallet onNavigate={setRoute} />}
        {route === 'learning' && <Learning onNavigate={setRoute} />}
        {route === 'store' && <Store onNavigate={setRoute} />}
        {route === 'patients' && <Patients onNavigate={setRoute} />}
        {route === 'appointments' && <Appointments onNavigate={setRoute} />}
        {route === 'ai-assistant' && <AiAssistant onNavigate={setRoute} />}
        {route === 'teleconsult-overview' && <TeleconsultOverview onNavigate={setRoute} />}
        {route === 'teleconsult-room' && <TeleconsultRoom onNavigate={setRoute} />}
        {route === 'teleconsult-prescription' && <TeleconsultPrescription onNavigate={setRoute} />}
        {route === 'settings' && <Settings onNavigate={setRoute} />}
        {route === 'notifications' && <DoctorNotifications onNavigate={setRoute} />}
        {route === 'freelance-cases' && <FreelanceCases onNavigate={setRoute} />}
      </div>
      <InstallPrompt />
    </main>
  )
}

export default App
