import { IStorage } from './storage';
import { db } from './db';
import { users, books, borrowings, reviews } from '../shared/schema';
import { User, Book, Borrowing, Review, InsertUser, InsertBook, InsertBorrowing, InsertReview } from '../shared/schema';
import { eq, and, like, or, desc, isNull } from 'drizzle-orm';
import { log } from './vite';

export class PostgresStorage implements IStorage {
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
    const searchTerm = `%${query}%`;
    return await db.select().from(books).where(
      or(
        like(books.title, searchTerm),
        like(books.author, searchTerm),
        like(books.description, searchTerm),
        like(books.genre, searchTerm)
      )
    );
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