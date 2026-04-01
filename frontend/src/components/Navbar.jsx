import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiDollarSign, FiUsers, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/records', label: 'Records', icon: FiDollarSign },
  ];

  if (isAdmin) {
    navItems.push({ path: '/users', label: 'Users', icon: FiUsers });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <FiDollarSign className="text-2xl text-blue-600" />
              <span className="font-bold text-xl text-gray-900">FinanceDash</span>
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <FiUser className="text-gray-400" />
              <span>{user?.name}</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
            >
              <FiLogOut />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden border-t border-gray-200 px-4 py-2 flex space-x-4 justify-around">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center py-2 ${
              isActive(item.path) ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <item.icon className="text-xl" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
