import { Book, PaginationInfo } from "@/lib/types";
import BookCard from "./BookCard";
import Pagination from "./Pagination";

interface BookGridProps {
  books: Book[];
  isLoading: boolean;
  isLoggedIn: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
}

export const BookGrid = ({ 
  books, 
  isLoading, 
  isLoggedIn,
  pagination,
  onPageChange
}: BookGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {Array(10).fill(0).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden h-96 animate-pulse">
            <div className="h-64 bg-gray-300"></div>
            <div className="p-4">
              <div className="h-5 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-3 w-5/6"></div>
              <div className="h-8 bg-gray-300 rounded mt-2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center my-8">
        <i className="fas fa-books text-gray-300 text-5xl mb-4"></i>
        <h3 className="text-xl font-medium mb-2">No Books Found</h3>
        <p className="text-gray-600">
          We couldn't find any books matching your criteria. Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} isLoggedIn={isLoggedIn} />
        ))}
      </div>

      {pagination && (
        <div className="mt-8">
          <Pagination 
            currentPage={pagination.currentPage} 
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default BookGrid;
