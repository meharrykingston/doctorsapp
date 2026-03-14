import { useEffect, useMemo, useState } from "react"
import "./install-prompt.css"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("doctor_install_prompt_dismissed") === "1")
  const [isInstalled, setIsInstalled] = useState(false)

  const ua = navigator.userAgent.toLowerCase()
  const isIos = useMemo(() => /iphone|ipad|ipod/.test(ua), [ua])
  const isAndroid = useMemo(() => /android/.test(ua), [ua])

  useEffect(() => {
    setIsInstalled(isStandaloneMode())

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  async function onInstallClick() {
    if (!deferredPrompt) {
      return
    }
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  function onDismiss() {
    localStorage.setItem("doctor_install_prompt_dismissed", "1")
    setDismissed(true)
  }

  if (dismissed || isInstalled) {
    return null
  }

  if (isAndroid && deferredPrompt) {
    return (
      <div className="install-banner">
        <p>Install Astikan Doctor for full app experience.</p>
        <div>
          <button className="install-cta" onClick={onInstallClick}>Install</button>
          <button className="install-close" onClick={onDismiss}>Not now</button>
        </div>
      </div>
    )
  }

  if (isIos) {
    return (
      <div className="install-banner">
        <p>To install on iPhone: tap Share, then Add to Home Screen.</p>
        <div>
          <button className="install-close" onClick={onDismiss}>Got it</button>
        </div>
      </div>
    )
  }

  return null
}
