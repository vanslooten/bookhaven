import { 
  users, type User, type InsertUser,
  books, type Book, type InsertBook,
  borrowings, type Borrowing, type InsertBorrowing,
  reviews, type Review, type InsertReview
} from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

// Storage interface
export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Book operations
  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  getBooksByGenre(genre: string): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;

  // Borrowing operations
  getBorrowings(): Promise<Borrowing[]>;
  getBorrowing(id: number): Promise<Borrowing | undefined>;
  getUserBorrowings(userId: number): Promise<Borrowing[]>;
  getBookBorrowings(bookId: number): Promise<Borrowing[]>;
  createBorrowing(borrowing: InsertBorrowing): Promise<Borrowing>;
  updateBorrowing(id: number, borrowing: Partial<InsertBorrowing>): Promise<Borrowing | undefined>;
  returnBook(id: number): Promise<Borrowing | undefined>;
  
  // Review operations
  getReviews(): Promise<Review[]>;
  getReview(id: number): Promise<Review | undefined>;
  getBookReviews(bookId: number): Promise<Review[]>;
  getUserReviews(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private books: Map<number, Book>;
  private borrowings: Map<number, Borrowing>;
  private reviews: Map<number, Review>;
  private currentUserId: number;
  private currentBookId: number;
  private currentBorrowingId: number;
  private currentReviewId: number;

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.borrowings = new Map();
    this.reviews = new Map();
    this.currentUserId = 1;
    this.currentBookId = 1;
    this.currentBorrowingId = 1;
    this.currentReviewId = 1;

    // Initialize with some sample books
    this.initializeBooks();
    // Add an admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "Administrator",
      email: "admin@bookborrow.com",
      isAdmin: true
    });
  }

  // Initialize with some sample books
  private async initializeBooks() {
    const sampleBooks: InsertBook[] = [
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        description: "A classic novel about the American Dream set in the Roaring Twenties.",
        isbn: "978-3-16-148410-0",
        genre: "Fiction",
        publicationYear: 1925,
        coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80",
        totalCopies: 5,
        availableCopies: 3,
        pages: 180,
        rating: 4,
        reviewCount: 128
      },
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        description: "A powerful story of racial injustice and childhood innocence in the American South.",
        isbn: "978-0-06-112008-4",
        genre: "Fiction",
        publicationYear: 1960,
        coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80",
        totalCopies: 3,
        availableCopies: 2,
        pages: 281,
        rating: 5,
        reviewCount: 215
      },
      {
        title: "Brave New World",
        author: "Aldous Huxley",
        description: "A dystopian novel exploring the dangers of technological advancement and control.",
        isbn: "978-0-06-085052-4",
        genre: "Science Fiction",
        publicationYear: 1932,
        coverImage: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80",
        totalCopies: 2,
        availableCopies: 0,
        pages: 311,
        rating: 4,
        reviewCount: 98
      },
      {
        title: "1984",
        author: "George Orwell",
        description: "A chilling portrayal of a totalitarian society and the dangers of government surveillance.",
        isbn: "978-0-452-28423-4",
        genre: "Science Fiction",
        publicationYear: 1949,
        coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80",
        totalCopies: 4,
        availableCopies: 3,
        pages: 328,
        rating: 5,
        reviewCount: 186
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        description: "A romantic classic examining social class, reputation, and love in early 19th century England.",
        isbn: "978-0-14-143951-8",
        genre: "Fiction",
        publicationYear: 1813,
        coverImage: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=400&q=80",
        totalCopies: 3,
        availableCopies: 2,
        pages: 432,
        rating: 4,
        reviewCount: 152
      }
    ];

    for (const book of sampleBooks) {
      await this.createBook(book);
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Book methods
  async getBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async getBooksByGenre(genre: string): Promise<Book[]> {
    return Array.from(this.books.values()).filter(
      (book) => book.genre.toLowerCase() === genre.toLowerCase(),
    );
  }

  async searchBooks(query: string): Promise<Book[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.books.values()).filter(
      (book) =>
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery) ||
        book.genre.toLowerCase().includes(lowerQuery) ||
        book.description.toLowerCase().includes(lowerQuery),
    );
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.currentBookId++;
    const book: Book = { ...insertBook, id };
    this.books.set(id, book);
    return book;
  }

  async updateBook(id: number, bookData: Partial<InsertBook>): Promise<Book | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;

    const updatedBook = { ...book, ...bookData };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  async deleteBook(id: number): Promise<boolean> {
    return this.books.delete(id);
  }

  // Borrowing methods
  async getBorrowings(): Promise<Borrowing[]> {
    return Array.from(this.borrowings.values());
  }

  async getBorrowing(id: number): Promise<Borrowing | undefined> {
    return this.borrowings.get(id);
  }

  async getUserBorrowings(userId: number): Promise<Borrowing[]> {
    return Array.from(this.borrowings.values()).filter(
      (borrowing) => borrowing.userId === userId,
    );
  }

  async getBookBorrowings(bookId: number): Promise<Borrowing[]> {
    return Array.from(this.borrowings.values()).filter(
      (borrowing) => borrowing.bookId === bookId,
    );
  }

  async createBorrowing(insertBorrowing: InsertBorrowing): Promise<Borrowing> {
    const id = this.currentBorrowingId++;
    const borrowing: Borrowing = { ...insertBorrowing, id };
    this.borrowings.set(id, borrowing);

    // Update book available copies
    const book = this.books.get(borrowing.bookId);
    if (book && book.availableCopies > 0) {
      this.books.set(borrowing.bookId, {
        ...book,
        availableCopies: book.availableCopies - 1,
      });
    }

    return borrowing;
  }

  async updateBorrowing(id: number, borrowingData: Partial<InsertBorrowing>): Promise<Borrowing | undefined> {
    const borrowing = this.borrowings.get(id);
    if (!borrowing) return undefined;

    const updatedBorrowing = { ...borrowing, ...borrowingData };
    this.borrowings.set(id, updatedBorrowing);
    return updatedBorrowing;
  }

  async returnBook(id: number): Promise<Borrowing | undefined> {
    const borrowing = this.borrowings.get(id);
    if (!borrowing || borrowing.returnDate) return undefined;

    const updatedBorrowing = {
      ...borrowing,
      returnDate: new Date(),
      status: 'returned',
    };
    this.borrowings.set(id, updatedBorrowing);

    // Update book available copies
    const book = this.books.get(borrowing.bookId);
    if (book) {
      this.books.set(borrowing.bookId, {
        ...book,
        availableCopies: book.availableCopies + 1,
      });
    }

    return updatedBorrowing;
  }

  // Review methods
  async getReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values());
  }

  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getBookReviews(bookId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.bookId === bookId,
    );
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.userId === userId,
    );
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = { ...insertReview, id };
    this.reviews.set(id, review);

    // Update book rating and review count
    const book = this.books.get(review.bookId);
    const bookReviews = await this.getBookReviews(review.bookId);
    
    if (book) {
      const totalReviews = bookReviews.length + 1; // Include new review
      const totalRating = bookReviews.reduce((sum, r) => sum + r.rating, 0) + review.rating;
      const averageRating = Math.round(totalRating / totalReviews);
      
      this.books.set(review.bookId, {
        ...book,
        rating: averageRating,
        reviewCount: totalReviews,
      });
    }

    return review;
  }
}

export const storage = new MemStorage();
