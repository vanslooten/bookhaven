import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pkg from 'pg';
const { Pool } = pkg;
import { users, books, borrowings, reviews } from "../shared/schema";
import { eq, and, like, desc, isNull } from "drizzle-orm";
import { insertUserSchema, insertBookSchema, insertBorrowingSchema, insertReviewSchema } from "../shared/schema";
import { log } from "./vite";

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle instance
export const db = drizzle(pool);

// Function to initialize database
export async function initializeDatabase() {
  try {
    log("Initializing database...");
    
    try {
      // Perform migrations (creates tables if they don't exist)
      await migrate(db, { migrationsFolder: "drizzle" });
    } catch (migrationError) {
      // If the migrations folder doesn't exist, just log it and continue
      log(`Migration warning: ${migrationError}. Continuing with schema push.`);
    }
    
    log("Database initialization completed successfully");
    return true;
  } catch (error) {
    log(`Database initialization failed: ${error}`, "error");
    return false;
  }
}

// Function to seed initial data if tables are empty
export async function seedInitialData() {
  try {
    // Check if users table is empty
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      log("Seeding initial data...");
      
      // Create admin user
      await db.insert(users).values({
        username: "admin",
        password: "admin123", // In production, this should be hashed
        name: "Administrator",
        email: "admin@bookhaven.com",
        isAdmin: true
      });
      
      // Create sample books
      const sampleBooks = [
        {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          description: "A story of wealth, love, and tragedy in the Roaring Twenties.",
          isbn: "9780743273565",
          genre: "Fiction",
          publicationYear: 1925,
          coverImage: "https://m.media-amazon.com/images/I/71FTb9X6wsL._AC_UF1000,1000_QL80_.jpg",
          totalCopies: 3,
          availableCopies: 3,
          pages: 180,
          rating: 4,
          reviewCount: 1
        },
        {
          title: "To Kill a Mockingbird",
          author: "Harper Lee",
          description: "A story of racial injustice and moral growth in the American South during the 1930s.",
          isbn: "9780061120084",
          genre: "Fiction",
          publicationYear: 1960,
          coverImage: "https://m.media-amazon.com/images/I/71FLioeVKgL._AC_UF1000,1000_QL80_.jpg",
          totalCopies: 5,
          availableCopies: 5,
          pages: 281,
          rating: 5,
          reviewCount: 1
        },
        {
          title: "1984",
          author: "George Orwell",
          description: "A dystopian social science fiction novel that depicts a totalitarian regime.",
          isbn: "9780451524935",
          genre: "Science Fiction",
          publicationYear: 1949,
          coverImage: "https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg",
          totalCopies: 2,
          availableCopies: 2,
          pages: 328,
          rating: 4,
          reviewCount: 1
        }
      ];
      
      for (const book of sampleBooks) {
        await db.insert(books).values(book);
      }
      
      log("Initial data seeded successfully");
    } else {
      log("Database already contains data, skipping seed");
    }
    
    return true;
  } catch (error) {
    log(`Data seeding failed: ${error}`, "error");
    return false;
  }
}