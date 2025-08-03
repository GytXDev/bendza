
import React from 'react';
import { Menu } from 'lucide-react';

const MobileHeader = ({ onMenuClick }) => {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-[#1a1a1a] border-b border-[#2a2a2a] z-30 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="p-2 text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="BENDZA" className="w-8 h-8 rounded-lg" />
          <span className="text-white font-bold">BENDZA</span>
        </div>

        <div className="w-10"></div>
      </div>
    </header>
  );
};

export default MobileHeader;
