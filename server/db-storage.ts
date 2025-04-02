import { 
  users, type User, type InsertUser,
  books, type Book, type InsertBook,
  borrowings, type Borrowing, type InsertBorrowing,
  reviews, type Review, type InsertReview
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or, desc, isNull } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Book operations
  async getBooks(): Promise<Book[]> {
    return await db.select().from(books);
  }

  async getBook(id: number): Promise<Book | undefined> {
    const result = await db.select().from(books).where(eq(books.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getBooksByGenre(genre: string): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.genre, genre));
  }

  async searchBooks(query: string): Promise<Book[]> {
    // Convert to lowercase for case-insensitive search
    const searchTerm = `%${query.toLowerCase()}%`;
    console.log("Searching for books with searchTerm:", searchTerm);
    
    // Debug: log all books first to see what we're searching through
    const allBooks = await db.select().from(books);
    console.log("All books in database:", allBooks.map(b => b.title));
    
    // Use lower() SQL function to make the search case-insensitive
    // We'd need to use SQL.raw for case-insensitive search with Drizzle
    // For now, we'll retrieve all and filter in memory
    const results = allBooks.filter(book => 
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      book.description.toLowerCase().includes(query.toLowerCase()) ||
      book.genre.toLowerCase().includes(query.toLowerCase())
    );
    
    console.log(`Found ${results.length} books matching "${query}" after in-memory filtering`);
    return results;
  }

  async createBook(book: InsertBook): Promise<Book> {
    const result = await db.insert(books).values(book).returning();
    return result[0];
  }

  async updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined> {
    const result = await db.update(books).set(book).where(eq(books.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteBook(id: number): Promise<boolean> {
    const result = await db.delete(books).where(eq(books.id, id)).returning();
    return result.length > 0;
  }

  // Borrowing operations
  async getBorrowings(): Promise<Borrowing[]> {
    return await db.select().from(borrowings);
  }

  async getBorrowing(id: number): Promise<Borrowing | undefined> {
    const result = await db.select().from(borrowings).where(eq(borrowings.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserBorrowings(userId: number): Promise<Borrowing[]> {
    return await db.select().from(borrowings).where(eq(borrowings.userId, userId));
  }

  async getBookBorrowings(bookId: number): Promise<Borrowing[]> {
    return await db.select().from(borrowings).where(eq(borrowings.bookId, bookId));
  }

  async createBorrowing(borrowing: InsertBorrowing): Promise<Borrowing> {
    // Get current book to update available copies
    const bookResult = await db.select().from(books).where(eq(books.id, borrowing.bookId));
    if (bookResult.length > 0) {
      const book = bookResult[0];
      await db
        .update(books)
        .set({ availableCopies: book.availableCopies - 1 })
        .where(eq(books.id, borrowing.bookId));
    }

    const result = await db.insert(borrowings).values(borrowing).returning();
    return result[0];
  }

  async updateBorrowing(id: number, borrowing: Partial<InsertBorrowing>): Promise<Borrowing | undefined> {
    const result = await db.update(borrowings).set(borrowing).where(eq(borrowings.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async returnBook(id: number): Promise<Borrowing | undefined> {
    // Get the borrowing
    const borrowingResult = await db
      .select()
      .from(borrowings)
      .where(eq(borrowings.id, id));
    
    if (borrowingResult.length === 0) {
      return undefined;
    }
    
    const borrowing = borrowingResult[0];
    
    // Get the book
    const bookResult = await db
      .select()
      .from(books)
      .where(eq(books.id, borrowing.bookId));
    
    if (bookResult.length > 0) {
      const book = bookResult[0];
      // Update book available copies
      await db
        .update(books)
        .set({ availableCopies: book.availableCopies + 1 })
        .where(eq(books.id, borrowing.bookId));
    }
    
    // Update borrowing status
    const result = await db
      .update(borrowings)
      .set({ 
        returnDate: new Date(),
        status: 'returned'
      })
      .where(eq(borrowings.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }
  
  // Review operations
  async getReviews(): Promise<Review[]> {
    return await db.select().from(reviews);
  }

  async getReview(id: number): Promise<Review | undefined> {
    const result = await db.select().from(reviews).where(eq(reviews.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getBookReviews(bookId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.bookId, bookId));
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    // Update book rating
    const bookReviews = await this.getBookReviews(review.bookId);
    const totalRating = bookReviews.reduce((sum, r) => sum + r.rating, 0) + review.rating;
    const newReviewCount = bookReviews.length + 1;
    const newAverageRating = Math.round(totalRating / newReviewCount);
    
    await db
      .update(books)
      .set({ 
        rating: newAverageRating,
        reviewCount: newReviewCount
      })
      .where(eq(books.id, review.bookId));
    
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();