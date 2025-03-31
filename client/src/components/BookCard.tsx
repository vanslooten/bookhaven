import { Book } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { getAvailabilityBadge, isBookAvailable, truncateText } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { borrowBook } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

interface BookCardProps {
  book: Book;
  isLoggedIn: boolean;
}

export const BookCard = ({ book, isLoggedIn }: BookCardProps) => {
  const [isBorrowing, setIsBorrowing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const { text: availabilityText, class: availabilityClass } = getAvailabilityBadge(book);

  const handleBorrow = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to borrow books",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBorrowing(true);
      await borrowBook(book.id);
      
      toast({
        title: "Success!",
        description: `You have borrowed "${book.title}"`,
      });
      
      // Invalidate queries to refresh book data
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/borrowings'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to borrow the book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBorrowing(false);
    }
  };

  return (
    <Card className="book-card overflow-hidden transition-all duration-300 h-full flex flex-col hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <div
          className="block cursor-pointer"
          onClick={() => navigate(`/books/${book.id}`)}
        >
          <img
            src={book.coverImage}
            alt={`${book.title} cover`}
            className="w-full h-64 object-cover"
          />
        </div>
        <div className="absolute top-0 right-0 m-2">
          <span className={`inline-block ${availabilityClass} text-xs font-bold px-2 py-1 rounded backdrop-blur-sm`}>
            {availabilityText}
          </span>
        </div>
      </div>
      <CardContent className="p-4 flex-grow flex flex-col">
        <div
          className="hover:text-primary transition-colors cursor-pointer"
          onClick={() => navigate(`/books/${book.id}`)}
        >
          <h3 className="font-bold text-lg mb-1 line-clamp-1">{book.title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">{book.author}</p>
        <div className="flex items-center mb-3">
          <Rating value={book.rating || 0} />
          <span className="ml-1 text-xs text-gray-600">({book.reviewCount || 0} reviews)</span>
        </div>
        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
          {truncateText(book.description, 100)}
        </p>
        <div className="mt-auto">
          {isBookAvailable(book) ? (
            <Button 
              className="w-full"
              onClick={handleBorrow}
              disabled={isBorrowing}
            >
              {isBorrowing ? "Processing..." : "Borrow"}
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              Join Waitlist
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
