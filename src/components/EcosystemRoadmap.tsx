import React from 'react';

export function EcosystemRoadmap() {
  return (
    <div className="roadmap-container relative p-6 bg-[#04060A]/90 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-2xl shadow-2xl my-6">
      {/* Background Glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/20 blur-[50px] pointer-events-none" />
      
      <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-8 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        Neural Roadmap
      </div>
      
      <div className="relative flex flex-col items-center gap-10">
        {/* Core Node */}
        <div className="relative z-10 w-full flex justify-center">
          <a href="https://trusthub.tlid.io" className="group flex flex-col items-center gap-2 text-center decoration-none" target="_blank" rel="noreferrer">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/80">
              <span className="text-xl">◈</span>
            </div>
            <div className="font-bold text-white text-[11px] tracking-wider uppercase">Trust Hub</div>
          </a>
        </div>

        {/* Connections Layer (SVG) */}
        <svg className="absolute top-[40px] left-0 w-full h-[100px] pointer-events-none" style={{ zIndex: 0 }}>
          {/* Vertical stem */}
          <path d="M 50% 10 L 50% 50" stroke="rgba(6,182,212,0.3)" strokeWidth="2" strokeDasharray="4 2" fill="none" />
          
          {/* Horizontal crossbar */}
          <path d="M 16.66% 50 L 83.33% 50" stroke="rgba(6,182,212,0.3)" strokeWidth="2" strokeDasharray="4 2" fill="none" />

          {/* Left branch */}
          <path d="M 16.66% 50 L 16.66% 75" stroke="rgba(168,85,247,0.4)" strokeWidth="2" strokeDasharray="4 2" fill="none" />
          {/* Center branch */}
          <path d="M 50% 50 L 50% 75" stroke="rgba(16,185,129,0.4)" strokeWidth="2" strokeDasharray="4 2" fill="none" />
          {/* Right branch */}
          <path d="M 83.33% 50 L 83.33% 75" stroke="rgba(236,72,153,0.4)" strokeWidth="2" strokeDasharray="4 2" fill="none" />
        </svg>

        {/* Branch Nodes */}
        <div className="relative z-10 w-full flex justify-between px-0">
          {/* Node 1 */}
          <a href="https://tlid.io" className="group flex flex-col items-center gap-2 text-center decoration-none w-1/3" target="_blank" rel="noreferrer">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-purple-500/20 group-hover:border-purple-400 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <span className="text-lg">🆔</span>
            </div>
            <div className="font-bold text-white/80 text-[10px] uppercase tracking-wider group-hover:text-white transition-colors flex flex-col items-center">
              <span>TLID</span>
              <span className="text-[8px] text-purple-400">Identity</span>
            </div>
          </a>

          {/* Node 2 */}
          <a href="https://lume-lang.org" className="group flex flex-col items-center gap-2 text-center decoration-none w-1/3" target="_blank" rel="noreferrer">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-emerald-500/20 group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <span className="text-lg">💡</span>
            </div>
            <div className="font-bold text-white/80 text-[10px] uppercase tracking-wider group-hover:text-white transition-colors flex flex-col items-center">
              <span>Lume</span>
              <span className="text-[8px] text-emerald-400">Compute</span>
            </div>
          </a>

          {/* Node 3 */}
          <a href="https://trustgen.tlid.io" className="group flex flex-col items-center gap-2 text-center decoration-none w-1/3" target="_blank" rel="noreferrer">
            <div className="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/40 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-pink-500/20 group-hover:border-pink-400 group-hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              <span className="text-lg">🎨</span>
            </div>
            <div className="font-bold text-white/80 text-[10px] uppercase tracking-wider group-hover:text-white transition-colors flex flex-col items-center">
              <span>TrustGen</span>
              <span className="text-[8px] text-pink-400">Creation</span>
            </div>
          </a>
        </div>

        {/* External Tiers */}
        <div className="relative z-10 w-full mt-2 flex flex-wrap justify-center gap-2 px-2 pb-2">
             <a href="https://darkwavestudios.io" className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/50 hover:text-white hover:border-white/30 uppercase tracking-wider font-bold transition-all text-decoration-none whitespace-nowrap">🎛️ Studios</a>
             <a href="https://trustshield.tech" className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/50 hover:text-white hover:border-white/30 uppercase tracking-wider font-bold transition-all text-decoration-none whitespace-nowrap">🛡️ Shield</a>
             <a href="https://signalcast.tlid.io" className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/50 hover:text-white hover:border-white/30 uppercase tracking-wider font-bold transition-all text-decoration-none whitespace-nowrap">📡 Signal</a>
             <a href="https://speaking-code.tlid.io" className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/50 hover:text-white hover:border-white/30 uppercase tracking-wider font-bold transition-all text-decoration-none whitespace-nowrap">📖 Ebook</a>
        </div>
      </div>
    </div>
  );
}
