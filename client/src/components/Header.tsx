import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";
import SearchBar from "./SearchBar";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  user: User | null;
  isLoading: boolean;
}

export const Header = ({ user, isLoading }: HeaderProps) => {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [borrowedCount, setBorrowedCount] = useState(0);
  
  // Get borrowed books count
  useEffect(() => {
    if (user) {
      queryClient.fetchQuery({ 
        queryKey: ['/api/borrowings'],
      }).then((data) => {
        if (data) {
          // Filter active borrowings (not returned)
          const borrowings = data as any[];
          const active = borrowings.filter(b => !b.returnDate);
          setBorrowedCount(active.length);
        }
      }).catch(() => {
        // Ignore errors
      });
    }
  }, [user, queryClient]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/auth/logout', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      navigate('/');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      // Refresh the page to ensure all state is reset
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <div 
            className="text-2xl font-bold cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
              <i className="fas fa-home mr-2"></i>
              BookHaven
            </span>
          </div>
        </div>
        
        {!isMobile && <SearchBar className="flex-1 mx-10" />}
        
        <div className="flex items-center">
          {isLoading ? (
            <div className="h-10 w-20 bg-gray-200 animate-pulse rounded"></div>
          ) : user ? (
            <div className="flex">
              {user.isAdmin && (
                <div
                  className="mx-2 text-neutral-dark hover:text-primary cursor-pointer"
                  onClick={() => navigate('/admin')}
                >
                  <i className="fas fa-cog"></i>
                </div>
              )}
              <div
                className="mx-2 text-neutral-dark hover:text-primary cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                <i className="fas fa-book"></i>
                {borrowedCount > 0 && (
                  <span className="ml-1 bg-primary text-white rounded-full px-2 py-0.5 text-xs">
                    {borrowedCount}
                  </span>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 ml-2 h-8">
                    <span className="flex items-center">
                      {user.name ? (
                        <AvatarPlaceholder name={user.name} size="sm" />
                      ) : (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="ml-1 text-sm font-medium mr-1">{user.name || user.username}</span>
                      <i className="fas fa-chevron-down text-xs"></i>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    My Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Borrowed Books
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-700 cursor-pointer"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center">
              <div 
                className="font-medium text-primary hover:text-primary/80 mr-4 cursor-pointer"
                onClick={() => navigate('/login')}
              >
                Login
              </div>
              <Button onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile search bar */}
      {isMobile && (
        <div className="px-4 py-2">
          <SearchBar />
        </div>
      )}
    </header>
  );
};

export default Header;
