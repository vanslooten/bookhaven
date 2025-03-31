import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Book, Review } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Rating, RatingInput } from "@/components/ui/rating";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";
import { formatDate, isBookAvailable, borrowBook, addReview } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  // Fetch book details
  const { data: book, isLoading: isLoadingBook } = useQuery<Book>({
    queryKey: ['/api/books', Number(id)],
    queryFn: async () => {
      return fetch(`/api/books/${id}`, { credentials: 'include' }).then(res => res.json());
    },
  });
  
  // Fetch book reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<Review[]>({
    queryKey: ['/api/books', Number(id), 'reviews'],
    queryFn: async () => {
      return fetch(`/api/books/${id}/reviews`, { credentials: 'include' }).then(res => res.json());
    },
  });
  
  // Check if user is logged in
  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/session'],
    retry: false,
  });
  
  // Borrow book mutation
  const borrowMutation = useMutation({
    mutationFn: async () => {
      return borrowBook(Number(id));
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: `You have borrowed "${book?.title}"`,
      });
      
      // Update book and borrowings data
      queryClient.invalidateQueries({ queryKey: ['/api/books', Number(id)] });
      queryClient.invalidateQueries({ queryKey: ['/api/borrowings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to borrow book",
        variant: "destructive",
      });
    },
  });
  
  // Add review mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      return addReview(Number(id), reviewRating, reviewComment);
    },
    onSuccess: () => {
      toast({
        title: "Review Added",
        description: "Thank you for your review!",
      });
      
      // Reset form
      setReviewRating(0);
      setReviewComment("");
      
      // Update book and reviews data
      queryClient.invalidateQueries({ queryKey: ['/api/books', Number(id)] });
      queryClient.invalidateQueries({ queryKey: ['/api/books', Number(id), 'reviews'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });
  
  const handleBorrow = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to borrow books",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    borrowMutation.mutate();
  };
  
  const handleReviewSubmit = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post a review",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    if (reviewRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }
    
    reviewMutation.mutate();
  };
  
  // Filter reviews to display
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);
  
  if (isLoadingBook) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden animate-pulse">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 bg-gray-50 p-6 flex justify-center">
              <div className="h-[600px] w-[400px] bg-gray-300 rounded-lg"></div>
            </div>
            <div className="md:w-2/3 p-6">
              <div className="h-10 bg-gray-300 rounded mb-2 w-3/4"></div>
              <div className="h-6 bg-gray-300 rounded mb-4 w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded mb-6 w-1/4"></div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-300 rounded mb-1 w-1/4"></div>
                    <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
              <div className="h-6 bg-gray-300 rounded mb-2 w-1/4"></div>
              <div className="h-24 bg-gray-300 rounded mb-6"></div>
              <div className="h-12 bg-gray-300 rounded mb-6"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
            <p className="text-gray-600 mb-4">The book you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/")}>Return to Book Catalog</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-gray-50 p-6 flex justify-center">
            <img 
              src={book.coverImage} 
              alt={`${book.title} cover`} 
              className="h-auto max-w-full rounded-lg shadow-md"
            />
          </div>
          
          <div className="md:w-2/3 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">{book.title}</h2>
                <p className="text-xl text-gray-600 mb-2">{book.author}</p>
                <div className="flex items-center mb-4">
                  <Rating value={book.rating} />
                  <span className="ml-2 text-sm text-gray-600">({book.reviewCount} reviews)</span>
                </div>
              </div>
              <div>
                {isBookAvailable(book) ? (
                  <span className="inline-block bg-status-available text-white text-sm font-bold px-3 py-1 rounded-full">
                    Available
                  </span>
                ) : (
                  <span className="inline-block bg-status-unavailable text-white text-sm font-bold px-3 py-1 rounded-full">
                    Unavailable
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Genre</h3>
                <p className="text-base">{book.genre}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Published</h3>
                <p className="text-base">{book.publicationYear}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">ISBN</h3>
                <p className="text-base">{book.isbn}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Pages</h3>
                <p className="text-base">{book.pages}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {book.description}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {isBookAvailable(book) ? (
                <Button 
                  className="flex-1"
                  onClick={handleBorrow}
                  disabled={borrowMutation.isPending}
                >
                  {borrowMutation.isPending ? "Processing..." : "Borrow Now"}
                </Button>
              ) : (
                <Button variant="outline" className="flex-1" disabled>
                  Join Waitlist
                </Button>
              )}
              
              <Button variant="outline" className="flex-1">
                <i className="far fa-bookmark mr-2"></i>Add to Wishlist
              </Button>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-2">Availability</h3>
              <p className="text-gray-700">
                <i className={`fas fa-check-circle mr-2 ${isBookAvailable(book) ? 'text-status-available' : 'text-status-unavailable'}`}></i>
                {book.availableCopies} of {book.totalCopies} copies available
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Typical loan period: 14 days
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-6">
          <h3 className="text-xl font-bold mb-4">Reviews</h3>
          
          {isLoadingReviews ? (
            <div className="space-y-4">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="flex items-start mb-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-300 mr-3"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-300 rounded mb-1 w-1/4"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2 w-1/6"></div>
                    <div className="h-16 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-gray-600 italic mb-6">
              No reviews yet. Be the first to review this book!
            </p>
          ) : (
            <div className="mb-6">
              {displayedReviews.map((review) => (
                <div key={review.id} className="flex items-start mb-6">
                  {review.user ? (
                    <AvatarPlaceholder name={review.user.name} className="mr-3" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                  )}
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900 mr-2">
                        {review.user?.name || "Anonymous"}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <div className="flex text-secondary mb-2">
                      <Rating value={review.rating} />
                    </div>
                    <p className="text-gray-700">
                      {review.comment}
                    </p>
                  </div>
                </div>
              ))}
              
              {reviews.length > 2 && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="link" 
                    className="text-primary hover:text-primary/80"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews ? "Show Less" : `View all ${reviews.length} reviews`}
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <Separator className="my-6" />
          
          <div>
            <h4 className="font-bold mb-3">Add Your Review</h4>
            <div className="mb-3">
              <div className="flex items-center">
                <p className="mr-3 text-sm font-medium">Your Rating:</p>
                <RatingInput 
                  value={reviewRating} 
                  onChange={setReviewRating}
                />
              </div>
            </div>
            <Textarea 
              className="mb-3" 
              rows={3} 
              placeholder="Write your review here..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <Button 
              onClick={handleReviewSubmit}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
