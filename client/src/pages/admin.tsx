import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Book } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertBookSchema } from "@shared/schema";

// Extend the book schema for UI validation
const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  isbn: z.string().min(10, "ISBN must be at least 10 characters"),
  genre: z.string().min(1, "Genre is required"),
  publicationYear: z.coerce.number().min(1000).max(new Date().getFullYear()),
  coverImage: z.string().url("Please enter a valid URL"),
  totalCopies: z.coerce.number().min(1, "Must have at least 1 copy"),
  availableCopies: z.coerce.number().min(0, "Can't have negative copies"),
  pages: z.coerce.number().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: z.coerce.number().min(0).optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export default function Admin() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check if user is logged in and is admin
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

  // Fetch all books
  const { data: books = [], isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ['/api/books'],
    enabled: !!user && user.isAdmin,
  });

  // Initialize form with default values or selected book
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: selectedBook ? {
      ...selectedBook,
      publicationYear: selectedBook.publicationYear || undefined,
      pages: selectedBook.pages || undefined,
      rating: selectedBook.rating || 0,
      reviewCount: selectedBook.reviewCount || 0,
    } : {
      title: "",
      author: "",
      description: "",
      isbn: "",
      genre: "Fiction",
      publicationYear: undefined,
      coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80",
      totalCopies: 1,
      availableCopies: 1,
      pages: undefined,
      rating: 0,
      reviewCount: 0,
    },
  });

  // Update form when selected book changes
  useState(() => {
    if (selectedBook) {
      form.reset({
        ...selectedBook,
        publicationYear: selectedBook.publicationYear || undefined,
        pages: selectedBook.pages || undefined,
        rating: selectedBook.rating || 0,
        reviewCount: selectedBook.reviewCount || 0,
      });
    } else {
      form.reset({
        title: "",
        author: "",
        description: "",
        isbn: "",
        genre: "Fiction",
        publicationYear: undefined,
        coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80",
        totalCopies: 1,
        availableCopies: 1,
        pages: undefined,
        rating: 0,
        reviewCount: 0,
      });
    }
  }, [selectedBook]);

  // Add book mutation
  const addBookMutation = useMutation({
    mutationFn: async (data: BookFormValues) => {
      const response = await apiRequest("POST", "/api/books", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Book Added",
        description: "The book has been successfully added to the catalog.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      setShowAddBookDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add book. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BookFormValues }) => {
      const response = await apiRequest("PUT", `/api/books/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Book Updated",
        description: "The book has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      setShowAddBookDialog(false);
      setSelectedBook(null);
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update book. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/books/${id}`, null);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Book Deleted",
        description: "The book has been removed from the catalog.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookFormValues) => {
    if (isEditing && selectedBook) {
      updateBookMutation.mutate({ id: selectedBook.id, data });
    } else {
      addBookMutation.mutate(data);
    }
  };

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsEditing(true);
    setShowAddBookDialog(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this book? This action cannot be undone.")) {
      deleteBookMutation.mutate(id);
    }
  };

  // Filter books by search term
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user is admin
  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </Card>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You do not have permission to access this page.</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Book Inventory Management</h2>
            <Dialog open={showAddBookDialog} onOpenChange={setShowAddBookDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedBook(null);
                  setIsEditing(false);
                }}>
                  <i className="fas fa-plus mr-2"></i>Add New Book
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditing ? "Edit Book" : "Add New Book"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Book title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author</FormLabel>
                            <FormControl>
                              <Input placeholder="Author name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Book description" {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isbn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ISBN</FormLabel>
                            <FormControl>
                              <Input placeholder="ISBN" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="genre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Genre</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a genre" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Fiction">Fiction</SelectItem>
                                <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                                <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                                <SelectItem value="Mystery">Mystery</SelectItem>
                                <SelectItem value="Biography">Biography</SelectItem>
                                <SelectItem value="History">History</SelectItem>
                                <SelectItem value="Fantasy">Fantasy</SelectItem>
                                <SelectItem value="Romance">Romance</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="publicationYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publication Year</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Year" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pages</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Pages" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="coverImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cover Image URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="totalCopies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Copies</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="availableCopies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Available Copies</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" type="button">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        disabled={
                          addBookMutation.isPending || updateBookMutation.isPending
                        }
                      >
                        {addBookMutation.isPending || updateBookMutation.isPending
                          ? "Saving..."
                          : isEditing
                          ? "Update Book"
                          : "Add Book"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6">
            <div className="relative flex-grow max-w-md">
              <Input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary">
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>

          {isLoadingBooks ? (
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Info</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Copies</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-gray-500">No books found that match your search criteria.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-10 w-8 flex-shrink-0 mr-4">
                              <img
                                className="h-10 w-8 object-cover"
                                src={book.coverImage}
                                alt={`${book.title} cover`}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{book.title}</div>
                              <div className="text-sm text-gray-500">{book.author}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-500">
                          {book.isbn}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-500">
                          {book.genre}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-500">
                          <span className={book.availableCopies > 0 ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                            {book.availableCopies}
                          </span>{" "}
                          / {book.totalCopies}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              book.availableCopies > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {book.availableCopies > 0 ? "Available" : "Unavailable"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-status-info hover:text-blue-700 mr-3 h-auto p-1"
                            onClick={() => handleEdit(book)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-status-unavailable hover:text-red-700 h-auto p-1"
                            onClick={() => handleDelete(book.id)}
                            disabled={deleteBookMutation.isPending}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">System</span> information will be displayed here
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Note:</span> Borrowing activity and inventory updates will appear in this section
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
