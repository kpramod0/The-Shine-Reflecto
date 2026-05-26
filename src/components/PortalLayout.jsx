import React from 'react';
import { Home, Users, Briefcase, LayoutDashboard, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const PortalLayout = ({ children, role }) => {
  const menuItems = [
    { name: 'Home', icon: <Home size={20} />, path: '/portal/home' },
    { name: 'Member', icon: <Users size={20} />, path: '/portal/member' },
    { name: 'Management', icon: <Briefcase size={20} />, path: '/portal/management' },
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/portal/dashboard' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-[#1a1a1a] text-white p-8 flex flex-col justify-between fixed h-full">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-[#a6ad3c] rounded-lg"></div>
            <span className="text-xl font-black tracking-tight">TSR PORTAL</span>
          </div>

          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link 
                key={item.name} 
                to={item.path} 
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/10 transition-all font-bold text-gray-400 hover:text-white group"
              >
                <div className="group-hover:text-[#a6ad3c] transition-colors">{item.icon}</div>
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#a6ad3c] rounded-full flex items-center justify-center font-black">
              {role?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm">{role === 'admin' ? 'System Admin' : 'Supervisor'}</p>
              <p className="text-xs text-gray-500 font-bold uppercase">{role}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-red-400 font-bold hover:text-red-300 transition-colors" onClick={() => window.location.href = '/'}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-12">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black text-[#1a1a1a]">Overview</h1>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
             <div className="px-4 py-2 bg-[#f4f6e9] text-[#a6ad3c] rounded-xl font-black text-xs uppercase">Role: {role}</div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default PortalLayout;
