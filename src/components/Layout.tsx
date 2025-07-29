import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { 
  Home, 
  Plus, 
  User, 
  Wallet, 
  LogOut, 
  Menu,
  X,
  Zap,
  ChevronDown,
  Settings
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { currentUser, disconnectWallet, isWalletConnected } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleDisconnect = async () => {
    await disconnectWallet();
    navigate('/auth');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Campaigns', path: '/campaigns', icon: Zap },
    ...(currentUser ? [
      { label: 'Dashboard', path: '/dashboard', icon: User },
      { label: 'Wallet', path: '/wallet', icon: Wallet },
    ] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Spark Funds
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground/60 hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <>
                {currentUser.is_creator && (
                  <Link to="/create-campaign">
                    <Button size="sm" className="bg-gradient-primary hover:bg-gradient-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </Button>
                  </Link>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 px-3 rounded-lg border bg-background/50">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={currentUser.avatar_url || ""} alt={currentUser.name || ""} />
                          <AvatarFallback className="text-xs">{currentUser.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-medium">{currentUser.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {currentUser.wallet_balance?.toFixed(2)} ICP
                          </span>
                        </div>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-background/95 backdrop-blur-sm border shadow-lg" align="end" forceMount>
                    <div className="flex flex-col space-y-2 p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={currentUser.avatar_url || ""} alt={currentUser.name || ""} />
                          <AvatarFallback>{currentUser.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{currentUser.name}</p>
                          <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                        </div>
                      </div>
                      <div className="bg-accent/10 rounded-lg p-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Wallet Balance:</span>
                          <span className="font-medium">{currentUser.wallet_balance?.toFixed(2)} ICP</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Total Donated:</span>
                          <span className="font-medium">{currentUser.total_donated?.toFixed(2)} ICP</span>
                        </div>
                        {currentUser.is_creator && (
                          <div className="flex justify-between text-xs">
                            <span>Total Received:</span>
                            <span className="font-medium">{currentUser.total_received?.toFixed(2)} ICP</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wallet" className="cursor-pointer">
                        <Wallet className="mr-2 h-4 w-4" />
                        Wallet Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        App Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Disconnect Wallet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild className="bg-gradient-primary hover:bg-gradient-primary/90">
                <Link to="/auth">Connect Wallet</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background">
            <div className="container py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground/60 hover:text-foreground hover:bg-accent/50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {currentUser ? (
                <>
                   {currentUser.is_creator && (
                     <div className="pt-2 border-t border-border/40">
                       <Link
                         to="/create-campaign"
                         className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-accent/50"
                         onClick={() => setIsMobileMenuOpen(false)}
                       >
                         <Plus className="h-4 w-4" />
                         <span>Create Campaign</span>
                       </Link>
                     </div>
                   )}
                   <div className="pt-2 border-t border-border/40">
                     <Link
                       to="/profile"
                       className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-accent/50"
                       onClick={() => setIsMobileMenuOpen(false)}
                     >
                       <User className="h-4 w-4" />
                       <span>Profile</span>
                     </Link>
                     <button
                       onClick={() => {
                         handleDisconnect();
                         setIsMobileMenuOpen(false);
                       }}
                       className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-accent/50 w-full text-left"
                     >
                       <LogOut className="h-4 w-4" />
                       <span>Disconnect Wallet</span>
                     </button>
                   </div>
                </>
              ) : (
                <div className="pt-2 border-t border-border/40">
                  <Link
                    to="/auth"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-gradient-primary text-white hover:bg-gradient-primary/90"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Connect Wallet
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}