import React, { useContext } from 'react';
import { Link, useNavigate, useLocation }  from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';
import { AppContextType, UserType } from '../types';
import { HomeIcon, BuildingOfficeIcon, UserCircleIcon, PlusCircleIcon } from './icons'; // ChatBubbleLeftRightIcon removed as dashboard has messages
import { APP_NAME } from '../constants';

const NavLinkItem: React.FC<{ to: string; icon: React.FC<any>; label: string; currentPath: string }> = ({ to, icon: Icon, label, currentPath }) => {
  const isActive = currentPath === to || (to === "/" && currentPath.startsWith("/?")); // Simple active check
  return (
     <Link 
        to={to} 
        className={`text-white hover:text-accent transition-colors flex items-center space-x-1.5 px-3 py-2 rounded-md ${isActive ? 'bg-black bg-opacity-20' : ''}`}
        aria-current={isActive ? "page" : undefined}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
};


const Header: React.FC = () => {
  const { currentUser, logout } = useContext(AppContext) as AppContextType;
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="bg-primary shadow-lg sticky top-0 z-[100]"> {/* Increased z-index for toasts */}
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-3xl font-bold text-white hover:text-accent transition-colors duration-200">
          {APP_NAME}
        </Link>
        <nav className="flex items-center space-x-2 sm:space-x-3">
          <NavLinkItem to="/" icon={HomeIcon} label="Home" currentPath={location.pathname} />
          <NavLinkItem to="/properties" icon={BuildingOfficeIcon} label="Properties" currentPath={location.pathname} />
          
          {currentUser ? (
            <>
              <NavLinkItem to="/dashboard" icon={UserCircleIcon} label="Dashboard" currentPath={location.pathname} />
              {currentUser.userType === UserType.Landlord && (
                 <Link 
                    to="/dashboard?tab=listings&action=create" 
                    className="hidden sm:flex bg-accent text-primary font-semibold px-4 py-2 rounded-md hover:bg-yellow-400 transition-colors items-center space-x-1.5 shadow-sm hover:shadow-md"
                 >
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>List Property</span>
                </Link>
              )}
              <div className="relative group">
                <button 
                    onClick={() => navigate('/dashboard?tab=profile')}
                    className="flex items-center space-x-2 cursor-pointer p-1 rounded-full hover:bg-black hover:bg-opacity-10"
                    aria-label="User menu"
                >
                    <img src={currentUser.profilePicture || 'https://via.placeholder.com/150'} alt={currentUser.name} className="w-9 h-9 rounded-full border-2 border-accent object-cover"/>
                    <span className="hidden md:inline text-white font-medium group-hover:text-accent">{currentUser.name.split(' ')[0]}</span>
                </button>
              </div>
               <button 
                onClick={handleLogout} 
                className="bg-red-500 text-white font-semibold px-3 sm:px-4 py-2 rounded-md hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/auth" 
              className="bg-accent text-primary font-semibold px-5 py-2.5 rounded-md hover:bg-yellow-400 transition-colors shadow-md hover:shadow-lg"
            >
              Login / Sign Up
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;