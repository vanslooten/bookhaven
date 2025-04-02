import { 
  users, type User, type InsertUser,
  books, type Book, type InsertBook,
  borrowings, type Borrowing, type InsertBorrowing,
  reviews, type Review, type InsertReview
} from "@shared/schema";

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

// Import the DatabaseStorage from db-storage.ts
import { DatabaseStorage } from './db-storage';

// Export an instance of DatabaseStorage
export const storage = new DatabaseStorage();
