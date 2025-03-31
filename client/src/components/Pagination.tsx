import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className 
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange?.(page);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    // Always show first page
    pages.push(
      <Button
        key={1}
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        className={cn(
          "px-4 py-2 text-sm font-semibold", 
          currentPage === 1 ? "text-white" : "text-gray-900",
          "rounded-none"
        )}
        onClick={() => handlePageChange(1)}
      >
        1
      </Button>
    );
    
    // Calculate range of pages to show
    let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 3);
    
    if (endPage - startPage < maxPagesToShow - 3) {
      startPage = Math.max(2, totalPages - maxPagesToShow + 1);
    }
    
    // Show ellipsis if needed
    if (startPage > 2) {
      pages.push(
        <span 
          key="ellipsis1" 
          className="px-4 py-2 text-sm font-semibold text-gray-700"
        >
          ...
        </span>
      );
    }
    
    // Show middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          className={cn(
            "px-4 py-2 text-sm font-semibold", 
            currentPage === i ? "text-white" : "text-gray-900",
            "rounded-none"
          )}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    // Show ellipsis if needed
    if (endPage < totalPages - 1) {
      pages.push(
        <span 
          key="ellipsis2" 
          className="px-4 py-2 text-sm font-semibold text-gray-700"
        >
          ...
        </span>
      );
    }
    
    // Always show last page if totalPages > 1
    if (totalPages > 1) {
      pages.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          className={cn(
            "px-4 py-2 text-sm font-semibold", 
            currentPage === totalPages ? "text-white" : "text-gray-900",
            "rounded-none"
          )}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }
    
    return pages;
  };

  return (
    <div className={cn("flex justify-center", className)}>
      <nav className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
        <Button
          variant="outline"
          size="sm"
          className="px-2 py-2 text-gray-400 rounded-l-md rounded-r-none"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <span className="sr-only">Previous</span>
          <i className="fas fa-chevron-left h-5 w-5"></i>
        </Button>
        
        {renderPageNumbers()}
        
        <Button
          variant="outline"
          size="sm"
          className="px-2 py-2 text-gray-400 rounded-r-md rounded-l-none"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span className="sr-only">Next</span>
          <i className="fas fa-chevron-right h-5 w-5"></i>
        </Button>
      </nav>
    </div>
  );
};

export default Pagination;
