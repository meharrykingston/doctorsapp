import { useEffect, useMemo, useRef, useState } from 'react'
import { AppIcon } from '../../components/ui/icons'
import { createTeleconsultSession, joinTeleconsultSession } from '../../services/teleconsultApi'
import type { AppRoute } from '../../types/routes'
import { getDoctorProfile } from '../../utils/doctorProfile'
import './teleconsult-room.css'

type TeleconsultRoomProps = {
  onNavigate: (route: AppRoute) => void
}

type TeleconsultCase = {
  id: string
  name: string
  initials: string
}

type Phase = 'connecting' | 'live' | 'error' | 'ended'

const CASE_STORAGE_KEY = 'doctor:teleconsultCase'

function readCase(): TeleconsultCase {
  try {
    const raw = window.sessionStorage.getItem(CASE_STORAGE_KEY)
    if (!raw) return { id: 'APT-1', name: 'Patient', initials: 'PT' }
    const parsed = JSON.parse(raw) as Partial<TeleconsultCase>
    return {
      id: parsed.id ?? 'APT-1',
      name: parsed.name ?? 'Patient',
      initials: parsed.initials ?? 'PT',
    }
  } catch {
    return { id: 'APT-1', name: 'Patient', initials: 'PT' }
  }
}

function TeleconsultRoom({ onNavigate }: TeleconsultRoomProps) {
  const [phase, setPhase] = useState<Phase>('connecting')
  const [error, setError] = useState('')
  const [helperMessage, setHelperMessage] = useState('Joining your consultation room...')
  const [reconnectNonce, setReconnectNonce] = useState(0)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const retryCountRef = useRef(0)
  const currentCase = useMemo(() => readCase(), [])
  const profile = getDoctorProfile()
  const doctorName = profile.fullName ?? 'Doctor'
  const doctorId = profile.userId ?? (profile.mobile ?? 'doctor-demo').replace(/\s+/g, '')
  const companyId = (import.meta.env.VITE_COMPANY_ID as string | undefined) ?? 'hcltech'

  function teardownCall() {
    if (peerRef.current) {
      peerRef.current.ontrack = null
      peerRef.current.onicecandidate = null
      peerRef.current.close()
      peerRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
  }

  function buildWsUrl(sessionId: string, participantId: string, role: 'employee' | 'doctor') {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${window.location.host}/ws/teleconsult?sessionId=${sessionId}&participantId=${participantId}&role=${role}`
  }

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      try {
        setPhase('connecting')
        setError('')
        setHelperMessage('Joining your consultation room...')

        const storageSessionKey = `doctor:teleconsult:session:${currentCase.id}`
        let sessionId = window.sessionStorage.getItem(storageSessionKey) ?? ''

        if (!sessionId) {
          const created = await createTeleconsultSession({
            companyId,
            employeeId: `employee-${currentCase.initials.toLowerCase()}`,
            doctorId,
            appointmentId: currentCase.id,
          })
          sessionId = created.sessionId
          window.sessionStorage.setItem(storageSessionKey, sessionId)
        }

        const joined = await joinTeleconsultSession(sessionId, {
          participantType: 'doctor',
          participantId: doctorId,
          allowEarlyJoin: true,
        })

        if (!isMounted) return

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
          localVideoRef.current.muted = true
          await localVideoRef.current.play().catch(() => undefined)
        }

        const peer = new RTCPeerConnection({ iceServers: joined.rtc.iceServers })
        peerRef.current = peer
        stream.getTracks().forEach((track) => peer.addTrack(track, stream))

        peer.ontrack = (event) => {
          const [remoteStream] = event.streams
          if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream
            void remoteVideoRef.current.play().catch(() => undefined)
          }
        }

        const ws = new WebSocket(buildWsUrl(sessionId, doctorId, 'doctor'))
        wsRef.current = ws

        ws.onmessage = async (message) => {
          try {
            const data = JSON.parse(message.data as string) as { type?: string; sdp?: string; candidate?: RTCIceCandidateInit }
            if (!data.type) return
            if (data.type === 'offer' && data.sdp) {
              await peer.setRemoteDescription({ type: 'offer', sdp: data.sdp })
              const answer = await peer.createAnswer()
              await peer.setLocalDescription(answer)
              ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }))
            }
            if (data.type === 'answer' && data.sdp) {
              await peer.setRemoteDescription({ type: 'answer', sdp: data.sdp })
            }
            if (data.type === 'ice' && data.candidate) {
              await peer.addIceCandidate(data.candidate)
            }
            if (data.type === 'peer-joined') {
              const offer = await peer.createOffer()
              await peer.setLocalDescription(offer)
              ws.send(JSON.stringify({ type: 'offer', sdp: offer.sdp }))
            }
          } catch {
            // ignore malformed messages
          }
        }

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'join' }))
        }

        peer.onicecandidate = (event) => {
          if (event.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ice', candidate: event.candidate }))
          }
        }

        setPhase('live')
      } catch (err) {
        if (!isMounted) return
        if (retryCountRef.current < 4) {
          retryCountRef.current += 1
          setPhase('connecting')
          setHelperMessage('Preparing room. Retrying automatically...')
          window.setTimeout(() => {
            if (isMounted) void bootstrap()
          }, 1200)
          return
        }
        setPhase('error')
        setError(err instanceof Error ? err.message : 'Unable to connect right now. Please tap retry.')
      }
    }

    retryCountRef.current = 0
    void bootstrap()
    return () => {
      isMounted = false
      teardownCall()
    }
  }, [companyId, currentCase.id, currentCase.initials, doctorId, doctorName, onNavigate, reconnectNonce])

  return (
    <section className={`tele-room-page ${phase === 'live' ? 'live' : ''}`}>
      {phase !== 'live' ? (
        <header className="mobile-topbar tele-room-topbar">
          <button type="button" className="bar-icon" aria-label="back" onClick={() => onNavigate('appointments')}>
            <AppIcon name="arrow-left" className="bar-svg" />
          </button>
          <h1>Live Consultation</h1>
          <div className="bar-right">
            <span className="patient-chip">{currentCase.name}</span>
          </div>
        </header>
      ) : null}

      <main className="tele-room-content">
        {phase === 'connecting' ? (
          <section className="tele-room-status">
            <h3>Connecting secure room</h3>
            <p>{helperMessage} ({currentCase.id})</p>
          </section>
        ) : null}

        {phase === 'error' ? (
          <section className="tele-room-status error">
            <h3>Unable to start consultation</h3>
            <p>{error}</p>
            <button type="button" className="retry-btn" onClick={() => setReconnectNonce((prev) => prev + 1)}>
              Retry
            </button>
          </section>
        ) : null}

        <div className="tele-room-video">
          <div className="tele-room-video-remote">
            <video ref={remoteVideoRef} autoPlay playsInline className="tele-room-video-stream" />
            <div className="tele-room-video-placeholder">
              <span>Waiting for patient video…</span>
            </div>
          </div>
          <div className="tele-room-video-local">
            <video ref={localVideoRef} autoPlay playsInline muted className="tele-room-video-stream" />
            <span>Doctor</span>
          </div>
          <div className="tele-room-controls">
            <button
              type="button"
              className="end-call-btn"
              onClick={() => {
                teardownCall()
                setPhase('ended')
              }}
            >
              End Call
            </button>
          </div>
        </div>

        {phase === 'ended' ? (
          <section className="tele-room-complete-sheet">
            <h3>Consultation ended</h3>
            <p>Rejoin the room or mark this consultation complete and continue to prescription.</p>
            <div className="tele-room-complete-actions">
              <button type="button" className="ghost-complete-btn" onClick={() => setReconnectNonce((prev) => prev + 1)}>
                Rejoin
              </button>
              <button type="button" className="retry-btn" onClick={() => onNavigate('teleconsult-prescription')}>
                Mark Complete
              </button>
            </div>
          </section>
        ) : null}
      </main>
    </section>
  )
}

export default TeleconsultRoom
