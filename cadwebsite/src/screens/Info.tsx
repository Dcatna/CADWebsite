import React from 'react';
import { Link } from 'react-router-dom';

type Props = {}

const Info = (props: Props) => {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">

      {/* Glowing Background Orb */}
      <div className="absolute w-[1000px] h-[1000px] bg-green-500/15 rounded-full blur-[200px] animate-pulse pointer-events-none" />

      {/* Holographic Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Blurry Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          // big shapes
          { type: 'circle', size: 120, top: '10%', left: '15%', color: 'from-green-400/20 to-emerald-600/10', anim: 'animate-slowSpin' },
          { type: 'cube', size: 100, top: '25%', left: '70%', color: 'from-green-300/15 to-emerald-500/10', anim: 'animate-slowSpinReverse' },
          { type: 'triangle', size: 80, top: '65%', left: '20%', color: 'border-b-green-400/30', anim: 'animate-slowSpin' },
          { type: 'hex', size: 90, top: '50%', left: '80%', color: 'bg-green-400/20', anim: 'animate-slowSpinReverse' },
          // medium shapes
          { type: 'circle', size: 60, top: '15%', left: '50%', color: 'from-emerald-300/20 to-green-500/10', anim: 'animate-slowBounce' },
          { type: 'cube', size: 50, top: '75%', left: '60%', color: 'from-green-400/15 to-emerald-500/10', anim: 'animate-slowSpin' },
          { type: 'ring', size: 80, top: '40%', left: '35%', color: 'border-green-300/30', anim: 'animate-pulseSlow' },
          // small shapes
          { type: 'circle', size: 30, top: '70%', left: '45%', color: 'from-green-400/20 to-transparent', anim: 'animate-slowBounce' },
          { type: 'hex', size: 40, top: '85%', left: '25%', color: 'bg-green-400/15', anim: 'animate-slowSpin' },
        ].map((shape, i) => {
          if (shape.type === 'circle') {
            return (
              <div key={i} className={`absolute ${shape.anim} rounded-full blur-2xl bg-gradient-to-br ${shape.color}`} 
                style={{ width: shape.size, height: shape.size, top: shape.top, left: shape.left }} />
            )
          }
          if (shape.type === 'cube') {
            return (
              <div key={i} className={`absolute ${shape.anim} blur-2xl bg-gradient-to-br ${shape.color}`} 
                style={{ width: shape.size, height: shape.size, top: shape.top, left: shape.left, transform: 'rotate(20deg)' }} />
            )
          }
          if (shape.type === 'triangle') {
            return (
              <div key={i} className={`absolute ${shape.anim} blur-2xl`} 
                style={{ top: shape.top, left: shape.left, width: 0, height: 0, borderLeft: `${shape.size/2}px solid transparent`, borderRight: `${shape.size/2}px solid transparent`, borderBottom: `${shape.size}px solid rgba(34,197,94,0.3)` }} />
            )
          }
          if (shape.type === 'hex') {
            return (
              <div key={i} className={`absolute ${shape.anim} blur-2xl clip-hexagon ${shape.color}`} 
                style={{ width: shape.size, height: shape.size, top: shape.top, left: shape.left }} />
            )
          }
          if (shape.type === 'ring') {
            return (
              <div key={i} className={`absolute ${shape.anim} rounded-full blur-lg ${shape.color}`} 
                style={{ width: shape.size, height: shape.size, top: shape.top, left: shape.left, borderWidth: '3px', borderStyle: 'solid', background: 'transparent' }} />
            )
          }
          return null;
        })}
      </div>

      {/* Floating Particles */}
      <div className="pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-300/50 rounded-full blur-[1px] animate-floatParticle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      {/* Main Title */}
      <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-500 mb-4 animate-fadeIn drop-shadow-[0_0_15px_rgba(34,197,94,0.7)]">
        HoloDraft
      </h1>

      {/* Subtitle */}
      <h2 className="text-2xl text-green-300 font-semibold mb-6 animate-fadeIn delay-100">
        Enterprise CAD-to-AR Platform
      </h2>

      {/* Description */}
      <p className="text-gray-300 text-center max-w-2xl mb-10 animate-fadeIn delay-200">
        Transform your CAD models into fully interactive holographic experiences, seamlessly blending virtual design with real-world context.
      </p>

      {/* Buttons */}
      <div className="flex gap-4 animate-fadeIn delay-300 relative z-10">
        <Link 
          to="/signin"
          className="flex items-center justify-center gap-2 bg-gray-800/80 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105 backdrop-blur-md"
        >
          Sign In
        </Link>
        <Link 
          to="/signup"
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-700 text-black px-8 py-3 rounded-lg font-semibold transition-transform hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
        >
          Sign Up
        </Link>
      </div>
    </div>
  )
}

export default Info;
