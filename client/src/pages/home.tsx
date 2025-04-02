import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import BookGrid from "@/components/BookGrid";
import BookFilterBar from "@/components/BookFilterBar";
import { Book, BookFilters, PaginationInfo } from "@/lib/types";

export default function Home() {
  const [location] = useLocation();
  const [filters, setFilters] = useState<BookFilters>({
    search: "",
    genre: "",
    availability: "all",
    sort: "recent",
  });
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Extract search query from full URL
  useEffect(() => {
    console.log("HOME: URL location changed:", location);
    
    try {
      // Simple string handling of search params from the entire URL
      let searchQuery = "";
      
      // Handle if we have any search parameters
      if (location.includes("?")) {
        const queryPart = location.split("?")[1];
        console.log("HOME: URL query part:", queryPart);
        
        // Parse search query directly with URLSearchParams
        const params = new URLSearchParams(queryPart);
        searchQuery = params.get("search") || "";
        console.log("HOME: Extracted search query:", searchQuery);
      }
      
      // IMPORTANT: Always update filters to trigger a refetch
      // We need to update filters even when searchQuery is empty (to clear previous searches)
      console.log("HOME: Setting search filter to:", searchQuery);
      setFilters(prev => {
        const newFilters = {
          ...prev,
          search: searchQuery,
        };
        console.log("HOME: New filters:", newFilters);
        return newFilters;
      });
    } catch (error) {
      console.error("HOME: Error parsing search params:", error);
    }
  }, [location]);

  // Fetch books
  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ['/api/books', {
      search: filters.search,
      genre: filters.genre
    }],
    // The queryFn is handled by our global query client configuration
    refetchOnWindowFocus: false,
  });

  // Check if user is logged in
  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/session'],
    retry: false,
  });

  // Filter books client-side based on availability
  const filteredBooks = books.filter(book => {
    if (filters.availability === "all") return true;
    if (filters.availability === "available") return book.availableCopies > 0;
    if (filters.availability === "unavailable") return book.availableCopies === 0;
    return true;
  });

  // Sort books client-side
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (filters.sort === "title_asc") {
      return a.title.localeCompare(b.title);
    } else if (filters.sort === "title_desc") {
      return b.title.localeCompare(a.title);
    } else if (filters.sort === "rating") {
      const ratingA = typeof a.rating === 'number' ? a.rating : 0;
      const ratingB = typeof b.rating === 'number' ? b.rating : 0;
      return ratingB - ratingA;
    } else {
      // Default: recently added (using id as a proxy)
      return b.id - a.id;
    }
  });

  // Calculate pagination (for future server-side pagination)
  useEffect(() => {
    const totalItems = sortedBooks.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage));
    
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }));
  }, [sortedBooks.length]);

  // Handle filter changes
  const handleFilterChange = (newFilters: BookFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Paginate books (client-side for now)
  const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const end = start + pagination.itemsPerPage;
  const paginatedBooks = sortedBooks.slice(start, end);

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <BookFilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      <BookGrid 
        books={paginatedBooks}
        isLoading={isLoading}
        isLoggedIn={!!user}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </main>
  );
}
