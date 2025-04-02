import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertBookSchema, 
  insertBorrowingSchema,
  insertReviewSchema
} from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { fromZodError } from "zod-validation-error";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "bookborrow-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );
  
  // Set up passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // In a real app, you would check the hashed password here
        if (user.password !== password) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ 
          id: user.id, 
          username: user.username, 
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin 
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({ 
        id: user.id, 
        username: user.username, 
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin 
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        const errors = fromZodError(result.error);
        return res.status(400).json({ message: errors.message });
      }
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(result.data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(result.data);
      
      // Log the user in after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        
        return res.status(201).json({ 
          id: user.id, 
          username: user.username, 
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin 
        });
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  // Book routes
  app.get("/api/books", async (req, res) => {
    try {
      const { search, genre } = req.query;
      
      // Add debugging to trace the search request
      console.log("API books request received with params:", { search, genre });
      
      let books;
      
      if (search && typeof search === 'string') {
        console.log("Searching for books with query:", search);
        books = await storage.searchBooks(search);
        console.log(`Found ${books.length} books matching search query`);
      } else if (genre && typeof genre === 'string') {
        console.log("Filtering books by genre:", genre);
        books = await storage.getBooksByGenre(genre);
        console.log(`Found ${books.length} books in genre`);
      } else {
        console.log("Getting all books (no search or genre filter)");
        books = await storage.getBooks();
        console.log(`Returning ${books.length} total books`);
      }
      
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Error fetching books" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBook(Number(req.params.id));
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Error fetching book" });
    }
  });

  app.post("/api/books", isAdmin, async (req, res) => {
    try {
      const result = insertBookSchema.safeParse(req.body);
      
      if (!result.success) {
        const errors = fromZodError(result.error);
        return res.status(400).json({ message: errors.message });
      }
      
      const book = await storage.createBook(result.data);
      res.status(201).json(book);
    } catch (error) {
      res.status(500).json({ message: "Error creating book" });
    }
  });

  app.put("/api/books/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const book = await storage.getBook(id);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      const result = insertBookSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        const errors = fromZodError(result.error);
        return res.status(400).json({ message: errors.message });
      }
      
      const updatedBook = await storage.updateBook(id, result.data);
      res.json(updatedBook);
    } catch (error) {
      res.status(500).json({ message: "Error updating book" });
    }
  });

  app.delete("/api/books/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const book = await storage.getBook(id);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      const success = await storage.deleteBook(id);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Error deleting book" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting book" });
    }
  });

  // Borrowing routes
  app.get("/api/borrowings", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      let borrowings;
      
      if (user.isAdmin) {
        borrowings = await storage.getBorrowings();
      } else {
        borrowings = await storage.getUserBorrowings(user.id);
      }
      
      // Enhance borrowings with book details
      const enhancedBorrowings = await Promise.all(
        borrowings.map(async (borrowing) => {
          const book = await storage.getBook(borrowing.bookId);
          return {
            ...borrowing,
            book,
          };
        })
      );
      
      res.json(enhancedBorrowings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching borrowings" });
    }
  });

  app.post("/api/borrowings", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Override userId with authenticated user's ID for security
      const borrowingData = {
        ...req.body,
        userId: user.id,
        status: 'borrowed',
      };
      
      const result = insertBorrowingSchema.safeParse(borrowingData);
      
      if (!result.success) {
        const errors = fromZodError(result.error);
        return res.status(400).json({ message: errors.message });
      }
      
      // Check if book exists
      const book = await storage.getBook(result.data.bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      // Check if book is available
      if (book.availableCopies <= 0) {
        return res.status(400).json({ message: "Book is not available for borrowing" });
      }
      
      const borrowing = await storage.createBorrowing(result.data);
      
      // Get the updated book to return along with the borrowing
      const updatedBook = await storage.getBook(result.data.bookId);
      
      res.status(201).json({ 
        borrowing, 
        book: updatedBook 
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating borrowing" });
    }
  });

  app.put("/api/borrowings/:id/return", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const borrowing = await storage.getBorrowing(id);
      
      if (!borrowing) {
        return res.status(404).json({ message: "Borrowing record not found" });
      }
      
      const user = req.user as any;
      
      // Check if the user is the borrower or an admin
      if (borrowing.userId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if already returned
      if (borrowing.returnDate) {
        return res.status(400).json({ message: "Book already returned" });
      }
      
      const updatedBorrowing = await storage.returnBook(id);
      
      // Get the updated book
      const updatedBook = await storage.getBook(borrowing.bookId);
      
      res.json({ 
        borrowing: updatedBorrowing, 
        book: updatedBook 
      });
    } catch (error) {
      res.status(500).json({ message: "Error returning book" });
    }
  });

  // Get book reviews
  app.get("/api/books/:id/reviews", async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      const book = await storage.getBook(bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      const reviews = await storage.getBookReviews(bookId);
      
      // Enhance reviews with user info (excluding password)
      const enhancedReviews = await Promise.all(
        reviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return {
            ...review,
            user: user ? {
              id: user.id,
              username: user.username,
              name: user.name,
            } : undefined,
          };
        })
      );
      
      res.json(enhancedReviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

  // Create a review
  app.post("/api/books/:id/reviews", isAuthenticated, async (req, res) => {
    try {
      const bookId = Number(req.params.id);
      const user = req.user as any;
      
      // Override userId and bookId for security
      const reviewData = {
        ...req.body,
        userId: user.id,
        bookId,
      };
      
      const result = insertReviewSchema.safeParse(reviewData);
      
      if (!result.success) {
        const errors = fromZodError(result.error);
        return res.status(400).json({ message: errors.message });
      }
      
      // Check if book exists
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      
      const review = await storage.createReview(result.data);
      
      // Get the updated book (for the new rating)
      const updatedBook = await storage.getBook(bookId);
      
      res.status(201).json({ 
        review: {
          ...review,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
          },
        }, 
        book: updatedBook 
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating review" });
    }
  });

  // Get genres for filtering
  app.get("/api/genres", async (req, res) => {
    try {
      const books = await storage.getBooks();
      const genreSet = new Set<string>();
      books.forEach(book => genreSet.add(book.genre));
      const genres = Array.from(genreSet).sort();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ message: "Error fetching genres" });
    }
  });
  
  // Add a dedicated search endpoint to use directly
  app.get("/api/search", async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        console.log("Search endpoint called but no query parameter was provided");
        return res.status(400).json({ message: "Search query is required" });
      }
      
      console.log("********* DIRECT SEARCH ENDPOINT CALLED *********");
      console.log("Direct search endpoint called with query:", query);
      console.log("Raw request query parameters:", req.query);
      
      const books = await storage.searchBooks(query);
      console.log(`Found ${books.length} books matching direct search query`);
      
      res.json(books);
    } catch (error) {
      console.error("Error in direct search:", error);
      res.status(500).json({ message: "Error searching books" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
