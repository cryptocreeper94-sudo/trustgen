/* ====== TrustGen — Main Application ====== */
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Viewport } from './components/Viewport'
import { Sidebar } from './components/Sidebar'
import { ViewportToolbar } from './components/ViewportToolbar'
import { CommandPalette } from './components/CommandPalette'
import { StudioPanel } from './components/StudioPanel'
import { useStudioStore } from './stores/studioStore'
import { ToastContainer } from './components/Toast'
import { OnboardingModal, resetOnboarding } from './components/OnboardingModal'
import { useEngineStore, startAutoSave } from './store'
import { useAuthStore } from './stores/authStore'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { SMSOptInPage } from './pages/SMSOptInPage'
import { BillingPage } from './pages/BillingPage'
import { ExplorePage } from './pages/ExplorePage'
import { DevPortalPage } from './pages/DevPortalPage'
import { TermsPage } from './pages/TermsPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { LegalPage } from './pages/LegalPage'
import { BlogPage } from './pages/BlogPage'
import { BlogPostPage } from './pages/BlogPostPage'
import { SignalChatWidget } from './components/SignalChatWidget'
import { HamburgerMenu } from './components/HamburgerMenu'
import { InvestorPage } from './pages/InvestorPage'
import { WorkspacePage } from './pages/WorkspacePage'
import { AffiliatePage } from './pages/AffiliatePage'
import { SiteBuilderPage } from './pages/SiteBuilderPage'

/* ── Auth Guard ── */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const token = useAuthStore(s => s.token)

  if (!token && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

/* ── Referral Capture ── */
function ReferralCapture() {
  const { hash } = useParams()
  useEffect(() => {
    if (hash) {
      localStorage.setItem('trustgen-referral', hash)
      // Track click
      fetch('/api/referrals/track-click', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: hash }),
      }).catch(() => { })
    }
  }, [hash])
  return <Navigate to="/explore" replace />
}
/* ── 3D Editor Layout ── */
function EditorLayout() {
  const nodeCount = useEngineStore(s => Object.keys(s.nodes).length)
  const selectedId = useEngineStore(s => s.editor.selectedNodeId)
  const node = useEngineStore(s => selectedId ? s.nodes[selectedId] : null)
  const timeline = useEngineStore(s => s.timeline)

  useEffect(() => {
    const state = useEngineStore.getState()
    if (Object.keys(state.nodes).length === 0) {
      state.addNode({
        kind: 'mesh', name: 'Cube', primitive: 'box',
        transform: { position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 45, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        material: { color: '#06b6d4', metalness: 0.3, roughness: 0.4, emissive: '#164e63', emissiveIntensity: 0.2, opacity: 1, transparent: false, wireframe: false, preset: 'default' },
      })
      state.addNode({
        kind: 'mesh', name: 'Sphere', primitive: 'sphere',
        transform: { position: { x: 2, y: 0.5, z: -1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        material: { color: '#06b6d4', metalness: 0.8, roughness: 0.1, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false, preset: 'chrome' },
      })
      state.addNode({
        kind: 'mesh', name: 'Ground', primitive: 'plane',
        transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: -90, y: 0, z: 0 }, scale: { x: 10, y: 10, z: 1 } },
        material: { color: '#1a1a2e', metalness: 0, roughness: 0.95, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false, preset: 'concrete' },
      })
      state.addNode({
        kind: 'light', name: 'Point Light',
        light: { kind: 'point', color: '#06b6d4', intensity: 2, castShadow: true, distance: 15, decay: 2 },
        transform: { position: { x: 2, y: 3, z: 2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      })
    }
    startAutoSave()
  }, [])

  const studioPanelOpen = useStudioStore(s => s.panelOpen)
  const toggleStudio = useStudioStore(s => s.togglePanel)

  return (
    <div className="app-layout">
      <div className="workspace-split">
        {studioPanelOpen && <StudioPanel />}
        <div className="viewport-container">
          <Viewport />
          <ViewportToolbar />
          <div className="status-bar">
            <span className="status-item"><span className="status-dot" /> WebGL2</span>
            <span className="status-item">Objects: {nodeCount}</span>
            {node && <span className="status-item">Selected: {node.name}</span>}
            <span className="status-item">{timeline.playing ? `▶ ${timeline.currentTime.toFixed(1)}s` : '⏸ Paused'}</span>
            <button className="status-item studio-toggle-btn" onClick={toggleStudio}
              title={studioPanelOpen ? 'Close Studio IDE' : 'Open Studio IDE'}>
              {studioPanelOpen ? '◀ IDE' : '▶ IDE'}
            </button>
            <span className="status-item" style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.7 }}
              onClick={() => { resetOnboarding(); window.location.reload() }} title="Replay onboarding tour">
              ❓ Help
            </span>
          </div>
        </div>
      </div>
      <Sidebar />
      <CommandPalette />
      <OnboardingModal />
    </div>
  )
}

import { PresaleBanner } from './components/PresaleBanner'
import { EcosystemAccountHub } from './components/EcosystemAccountHub'
import { AmbientOrbs } from './components/AmbientOrbs'
import { CustomCursor } from './components/CustomCursor'
import { PWAInstallBanner } from './components/PWAInstallBanner'

/* ── Root App with Router ── */
export default function App() {
  const checkAuth = useAuthStore(s => s.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <CustomCursor />
      <AmbientOrbs />
      <PresaleBanner />
      <EcosystemAccountHub />
      <Routes>
        {/* Public routes */}
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/dev-portal" element={<DevPortalPage />} />
        <Route path="/investors" element={<InvestorPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/editor/:projectId?" element={
          <EditorLayout />
        } />
        <Route path="/sms-opt-in" element={
          <ProtectedRoute><SMSOptInPage /></ProtectedRoute>
        } />
        <Route path="/billing" element={
          <ProtectedRoute><BillingPage /></ProtectedRoute>
        } />
        <Route path="/workspace" element={
          <ProtectedRoute><WorkspacePage /></ProtectedRoute>
        } />
        <Route path="/affiliate" element={
          <ProtectedRoute><AffiliatePage /></ProtectedRoute>
        } />
        <Route path="/studio" element={
          <ProtectedRoute><SiteBuilderPage /></ProtectedRoute>
        } />

        {/* Referral capture route */}
        <Route path="/ref/:hash" element={
          <ReferralCapture />
        } />

        {/* Default → Explore */}
        <Route path="/" element={<Navigate to="/explore" replace />} />
        <Route path="*" element={<Navigate to="/explore" replace />} />
      </Routes>
      <ToastContainer />
      <SignalChatWidget />
      <HamburgerMenu />
      <PWAInstallBanner />
    </BrowserRouter>
  )
}
