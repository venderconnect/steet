import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, LogOut, ShoppingCart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-background/95 border-b sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">StreetFood Connect</span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/products" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/products') ? 'text-primary' : 'text-muted-foreground'}`}>
                Products
              </Link>
              {user?.role === 'supplier' ? (
                <>
                 <Link to="/supplier" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/supplier') ? 'text-primary' : 'text-muted-foreground'}`}>
                   Dashboard
                 </Link>
                 <Link to="/my-products" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/my-products') ? 'text-primary' : 'text-muted-foreground'}`}>
                   My Products
                 </Link>
                </>
              ) : (
                 <Link to="/orders" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/orders') ? 'text-primary' : 'text-muted-foreground'}`}>
                   My Orders
                 </Link>
              )}
            </div>
          )}

          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4" />
                    <span>{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-muted-foreground capitalize">{user.role}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-x-2">
                <Button variant="ghost" asChild><Link to="/login">Login</Link></Button>
                <Button asChild><Link to="/register">Register</Link></Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
