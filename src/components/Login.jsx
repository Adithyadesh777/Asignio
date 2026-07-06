import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailAuth = async () => {
    setLoading(true)
    setError('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setError('Check your email to confirm your account!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Dynamic Keyframe Animations */}
      <style>{`
        @keyframes floatNetwork {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes pulseLine {
          0%, 100% { opacity: 0.2; stroke-width: 1px; }
          50% { opacity: 0.6; stroke-width: 2px; }
        }
        @keyframes particleFlow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        .animated-network {
          animation: floatNetwork 8s ease-in-out infinite;
        }
        .network-line {
          animation: pulseLine 4s ease-in-out infinite;
        }
        .flow-particle {
          stroke-dasharray: 10, 30;
          animation: particleFlow 4s linear infinite;
        }
      `}</style>

      {/* LEFT SIDE: Beautiful 3D Glass-Node Moving Canvas */}
      <div className="hidden md:flex md:w-1/2 lg:w-7/12 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-16 flex-col justify-between relative overflow-hidden border-r border-slate-800/40">
        
        {/* Soft Ambient Background Glows */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Moving Glassmorphic Structure Layer */}
        <div className="absolute inset-0 flex items-center justify-center scale-100 animated-network">
          <svg className="w-full h-full max-w-lg max-h-lg" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            
            {/* Definitions for 3D Glass Sphere Shading */}
            <defs>
              <radialGradient id="glassSphere" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="40%" stopColor="#818cf8" stopOpacity="0.25" />
                <stop offset="80%" stopColor="#312e81" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
              </radialGradient>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>

            {/* Connecting Static Structural Lines */}
            <g stroke="url(#lineGrad)" strokeOpacity="0.3" className="network-line">
              <line x1="200" y1="90" x2="310" y2="170" />
              <line x1="310" y1="170" x2="310" y2="290" />
              <line x1="310" y1="290" x2="200" y2="350" />
              <line x1="200" y1="350" x2="90" y2="290" />
              <line x1="90" y1="290" x2="90" y2="170" />
              <line x1="90" y1="170" x2="200" y2="90" />
              
              {/* Internal Lattice Connections */}
              <line x1="200" y1="90" x2="200" y2="220" />
              <line x1="90" y1="170" x2="200" y2="220" />
              <line x1="310" y1="170" x2="200" y2="220" />
              <line x1="90" y1="290" x2="200" y2="220" />
              <line x1="310" y1="290" x2="200" y2="220" />
              <line x1="200" y1="350" x2="200" y2="220" />
            </g>

            {/* Kinetic Moving Energy Particles along paths */}
            <g stroke="url(#lineGrad)" strokeWidth="2" className="flow-particle" strokeOpacity="0.6">
              <line x1="200" y1="90" x2="310" y2="170" />
              <line x1="90" y1="290" x2="200" y2="220" />
              <line x1="200" y1="350" x2="200" y2="220" />
            </g>

            {/* 3D-Look Glossy Spheres (Matching Gemini_Generated_Image_lk0yaalk0yaalk0y.png Structure) */}
            <circle cx="200" cy="90" r="16" fill="url(#glassSphere)" stroke="#818cf8" strokeWidth="0.5" strokeOpacity="0.5" />
            <circle cx="310" cy="170" r="20" fill="url(#glassSphere)" stroke="#818cf8" strokeWidth="0.5" strokeOpacity="0.5" />
            <circle cx="310" cy="290" r="18" fill="url(#glassSphere)" stroke="#818cf8" strokeWidth="0.5" strokeOpacity="0.5" />
            <circle cx="200" cy="350" r="15" fill="url(#glassSphere)" stroke="#818cf8" strokeWidth="0.5" strokeOpacity="0.5" />
            <circle cx="90" cy="290" r="19" fill="url(#glassSphere)" stroke="#818cf8" strokeWidth="0.5" strokeOpacity="0.5" />
            <circle cx="90" cy="170" r="17" fill="url(#glassSphere)" stroke="#818cf8" strokeWidth="0.5" strokeOpacity="0.5" />
            <circle cx="200" cy="220" r="24" fill="url(#glassSphere)" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.7" />

          </svg>
        </div>

        {/* Top Header Label */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 px-3 py-1.5 rounded-full text-indigo-400 font-medium tracking-wider text-xs uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-ping"></span>
            Smart Assignment Management System 
          </div>
        </div>

        {/* Core App Brand Block */}
        <div className="relative z-10 space-y-3">
          <h1 className="text-5xl font-serif font-semibold text-white tracking-tight">Asignio</h1>
          <p className="text-slate-400 text-lg font-light max-w-sm leading-relaxed">
            Fluid architectural data nodes structuring your personal task landscapes flawlessly.
          </p>
        </div>

        {/* Minimal Copyright Statement */}
        <div className="relative z-10 text-xs text-slate-600 font-medium tracking-wide">
          © {new Date().getFullYear()} Asignio System Workspace.
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Authentic Form Panel */}
      <div className="w-full md:w-1/2 lg:w-5/12 bg-white flex items-center justify-center p-8 sm:p-16 relative">
        <div className="w-full max-w-md space-y-8">
          
          {/* Form Header */}
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {isSignUp ? 'Create account' : 'Login'}
            </h2>
            <p className="text-sm text-slate-500">
              {isSignUp ? 'Sign up using your email and password credentials.' : 'Welcome back! Please enter your details.'}
            </p>
          </div>

          {/* Form Content Inputs */}
          <div className="space-y-5">
            {/* Email Form Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            {/* Password Form Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Password</label>
                {!isSignUp && (
                  <a href="#" className="text-xs font-medium text-indigo-600 hover:underline">Forgot password?</a>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Verification Status Feedback Alert */}
          {error && (
            <div className={`p-3.5 rounded-xl text-xs font-medium border text-center transition-all ${
              error.includes('confirm') 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border-rose-100 text-rose-600'
            }`}>
              {error}
            </div>
          )}

          {/* Form Processing Triggers */}
          <div className="space-y-4">
            <button
              onClick={handleEmailAuth}
              disabled={loading}
              className="w-full relative group bg-gradient-to-r from-slate-800 to-slate-900 text-white font-medium py-3 px-4 rounded-xl shadow-md active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none transition-all duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Login'}</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4">Or</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Exclusive Google Authentication */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition duration-150 shadow-sm active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Toggle Form Layout State Action */}
          <p className="text-center text-sm text-slate-500 pt-2">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-indigo-600 font-semibold ml-1.5 hover:underline focus:outline-none"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login;