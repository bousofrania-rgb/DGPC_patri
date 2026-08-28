import React from 'react';

export default function Logo3D() {
  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-[1000px]">
      <div className="relative w-48 h-48 animate-[spin_20s_linear_infinite] preserve-3d group-hover:animate-[spin_10s_linear_infinite] transition-all duration-500">
        
        {/* Core Cube */}
        <div className="absolute inset-0 m-auto w-24 h-24 preserve-3d">
          {/* Front */}
          <div className="absolute inset-0 bg-[#C84B31]/90 border border-white/20 shadow-[0_0_20px_rgba(200,75,49,0.5)] transform translate-z-12 flex items-center justify-center backdrop-blur-sm rounded-xl">
             <div className="w-12 h-12 border-2 border-white/50 rounded-lg"></div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 bg-[#C84B31]/80 border border-white/20 transform -translate-z-12 rounded-xl"></div>
          {/* Top */}
          <div className="absolute inset-0 bg-[#E06448]/90 border border-white/20 transform -rotate-x-90 translate-y-[-50%] translate-z-12 origin-top rounded-xl"></div>
          {/* Bottom */}
          <div className="absolute inset-0 bg-[#A63A22]/90 border border-white/20 transform rotate-x-90 translate-y-[50%] translate-z-12 origin-bottom rounded-xl"></div>
          {/* Right */}
          <div className="absolute inset-0 bg-[#B8422A]/90 border border-white/20 transform rotate-y-90 translate-x-[50%] translate-z-12 origin-right rounded-xl"></div>
          {/* Left */}
          <div className="absolute inset-0 bg-[#D4563C]/90 border border-white/20 transform -rotate-y-90 translate-x-[-50%] translate-z-12 origin-left rounded-xl"></div>
        </div>

        {/* Outer Tech Rings */}
        <div className="absolute inset-[-20%] rounded-full border border-[#C84B31]/30 transform rotate-x-60 animate-[spin_15s_linear_infinite_reverse]"></div>
        <div className="absolute inset-[-40%] rounded-full border border-[#C84B31]/20 transform rotate-y-60 animate-[spin_25s_linear_infinite]"></div>
        
        {/* Network Nodes */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)] transform translate-z-20"></div>
        <div className="absolute bottom-10 left-0 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] transform -translate-z-10"></div>
        
      </div>
      
      {/* Light effect */}
      <div className="absolute bottom-[-10%] w-[120%] h-[20%] bg-[#C84B31]/20 blur-2xl rounded-full transform rotate-x-90"></div>
    </div>
  );
}
