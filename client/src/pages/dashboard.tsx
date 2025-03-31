import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BorrowingWithDetails } from "@/lib/types";
import { formatDate, formatDueDate, getDueStatusClass, getStatusBadge, returnBook } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if user is logged in
  const { data: user, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ['/api/auth/session'],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: 'include',
      });
      
      if (res.status === 401) {
        throw new Error("Unauthorized");
      }
      
      return res.json();
    },
    retry: false,
  });
  
  // Fetch user's borrowings
  const { data: borrowings = [], isLoading: isLoadingBorrowings } = useQuery<BorrowingWithDetails[]>({
    queryKey: ['/api/borrowings'],
    enabled: !!user,
  });
  
  // Return book mutation
  const returnMutation = useMutation({
    mutationFn: async (borrowingId: number) => {
      return returnBook(borrowingId);
    },
    onSuccess: () => {
      toast({
        title: "Book Returned",
        description: "Thank you for returning the book!",
      });
      
      // Refresh borrowings data
      queryClient.invalidateQueries({ queryKey: ['/api/borrowings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to return book",
        variant: "destructive",
      });
    },
  });
  
  // Handle unauthorized access
  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-300">
                <div className="h-6 bg-gray-300 rounded mb-2 w-3/4"></div>
                <div className="h-10 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </Card>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to view your dashboard.</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate("/login")}>Login</Button>
              <Button variant="outline" onClick={() => navigate("/signup")}>Sign Up</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Filter borrowings
  const activeBorrowings = borrowings.filter(b => !b.returnDate);
  const returnedBorrowings = borrowings.filter(b => b.returnDate);
  
  // Find books due soon (within 3 days)
  const dueSoonCount = activeBorrowings.filter(b => {
    const dueDate = new Date(b.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }).length;
  
  // Find overdue books
  const overdueCount = activeBorrowings.filter(b => {
    const dueDate = new Date(b.dueDate);
    const now = new Date();
    return dueDate < now;
  }).length;
  
  const handleReturn = (borrowingId: number) => {
    returnMutation.mutate(borrowingId);
  };
  
  const handleRenew = (borrowingId: number) => {
    toast({
      title: "Coming Soon",
      description: "Renewal functionality will be available soon!",
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-md">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">Your Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-purple-50 p-4 rounded-lg border border-primary">
              <h3 className="font-bold text-lg mb-2">Currently Borrowed</h3>
              <p className="text-3xl font-bold text-primary">
                {activeBorrowings.length} <span className="text-sm text-gray-600 font-normal">books</span>
              </p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-secondary">
              <h3 className="font-bold text-lg mb-2">Books Due Soon</h3>
              <p className="text-3xl font-bold text-secondary">
                {dueSoonCount} <span className="text-sm text-gray-600 font-normal">books</span>
                {overdueCount > 0 && (
                  <span className="text-sm text-red-600 font-normal ml-2">({overdueCount} overdue)</span>
                )}
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-status-info">
              <h3 className="font-bold text-lg mb-2">Borrowing History</h3>
              <p className="text-3xl font-bold text-status-info">
                {borrowings.length} <span className="text-sm text-gray-600 font-normal">books total</span>
              </p>
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-4">Currently Borrowed Books</h3>
          
          {isLoadingBorrowings ? (
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          ) : activeBorrowings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <i className="fas fa-book text-gray-300 text-4xl mb-2"></i>
              <h4 className="text-lg font-medium mb-1">No Books Currently Borrowed</h4>
              <p className="text-gray-600 mb-4">You don't have any books checked out at the moment.</p>
              <Button onClick={() => navigate("/")}>Browse Books</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Book
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Borrowed Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeBorrowings.map((borrowing) => {
                    const dueStatusClass = getDueStatusClass(borrowing.dueDate);
                    let statusBadge = { class: '', text: '' };
                    
                    const now = new Date();
                    const dueDate = new Date(borrowing.dueDate);
                    
                    if (dueDate < now) {
                      statusBadge = { class: 'bg-red-100 text-red-800', text: 'Overdue' };
                    } else if ((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 3) {
                      statusBadge = { class: 'bg-yellow-100 text-yellow-800', text: 'Due Soon' };
                    } else {
                      statusBadge = { class: 'bg-green-100 text-green-800', text: 'On Time' };
                    }
                    
                    return (
                      <tr key={borrowing.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-8 flex-shrink-0 mr-4">
                              <img 
                                className="h-10 w-8 object-cover" 
                                src={borrowing.book?.coverImage} 
                                alt={`${borrowing.book?.title} cover`}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{borrowing.book?.title}</div>
                              <div className="text-sm text-gray-500">{borrowing.book?.author}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(borrowing.borrowDate)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${dueStatusClass}`}>
                          {formatDueDate(borrowing.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button 
                            variant="link" 
                            className="text-status-info hover:text-blue-700 p-0"
                            onClick={() => handleReturn(borrowing.id)}
                            disabled={returnMutation.isPending && returnMutation.variables === borrowing.id}
                          >
                            {returnMutation.isPending && returnMutation.variables === borrowing.id ? "Processing..." : "Return"}
                          </Button>
                          <Button 
                            variant="link" 
                            className="text-purple-600 hover:text-purple-800 ml-4 p-0"
                            onClick={() => handleRenew(borrowing.id)}
                          >
                            Renew
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {returnedBorrowings.length > 0 && (
            <>
              <Separator className="my-6" />
              
              <h3 className="text-xl font-bold mb-4">Borrowing History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Book
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Borrowed Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Returned Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {returnedBorrowings.map((borrowing) => {
                      const statusBadge = getStatusBadge(borrowing.status);
                      
                      return (
                        <tr key={borrowing.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-8 flex-shrink-0 mr-4">
                                <img 
                                  className="h-10 w-8 object-cover" 
                                  src={borrowing.book?.coverImage} 
                                  alt={`${borrowing.book?.title} cover`}
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{borrowing.book?.title}</div>
                                <div className="text-sm text-gray-500">{borrowing.book?.author}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(borrowing.borrowDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(borrowing.returnDate!)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.class}`}>
                              {statusBadge.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
