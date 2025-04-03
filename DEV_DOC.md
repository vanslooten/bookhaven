# BookHaven Developer Documentation

## Project Overview

BookHaven is a web-based book borrowing platform designed to provide an intuitive and engaging library management experience. It enables users to browse, search, and borrow books from small communal libraries, with a focus on dynamic user interactions and comprehensive book discovery capabilities.

## Technology Stack

### Frontend
- **React** with **TypeScript**: Used for building the user interface with type safety
- **TanStack Query (React Query)**: For data fetching, caching, and state management
- **Wouter**: Lightweight routing solution for navigation
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Shadcn UI**: Component library built on Radix UI for accessible and customizable UI elements
- **Zod**: Schema validation library used for form validation

### Backend
- **Node.js** with **Express**: Server framework for handling API requests
- **TypeScript**: For type-safe backend code
- **Drizzle ORM**: Database ORM for PostgreSQL
- **Passport.js**: Authentication middleware
- **Express Session**: Session management for user authentication

### Database
- **PostgreSQL**: Relational database for data persistence
- **Drizzle Kit**: Database migration tool

### Build & Development Tools
- **Vite**: Fast development server and build tool
- **tsx**: TypeScript execution engine
- **ESBuild**: JavaScript bundler

## Project Structure

```
/
├── client/                    # Frontend application
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   │   ├── ui/            # Reusable UI components (Shadcn)
│   │   │   └── [...]          # App-specific components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions and type definitions
│   │   ├── pages/             # Page components
│   │   ├── App.tsx            # Main application component
│   │   ├── main.tsx           # Application entry point
│   │   └── index.css          # Global styles
│   └── index.html             # HTML template
├── server/                    # Backend application
│   ├── db.ts                  # Database connection setup
│   ├── db-storage.ts          # Database storage implementation
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API route definitions
│   ├── storage.ts             # Storage interface definition
│   └── vite.ts                # Vite integration
├── shared/                    # Shared code between frontend and backend
│   └── schema.ts              # Database schema and type definitions
├── drizzle/                   # Drizzle ORM files
│   └── meta/                  # Metadata for Drizzle migrations
├── migrations/                # Database migration files
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── theme.json                 # UI theme configuration
└── drizzle.config.ts          # Drizzle ORM configuration
```

## Key Components

### Database Schema (`shared/schema.ts`)

The application uses a relational database with the following main tables:

#### Users Table
```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});
```

#### Books Table
```typescript
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull(),
  isbn: text("isbn").notNull(),
  genre: text("genre").notNull(),
  publicationYear: integer("publication_year"),
  coverImage: text("cover_image").notNull(),
  totalCopies: integer("total_copies").notNull(),
  availableCopies: integer("available_copies").notNull(),
  pages: integer("pages"),
  rating: integer("rating"),
  reviewCount: integer("review_count"),
});
```

#### Borrowings Table
```typescript
export const borrowings = pgTable("borrowings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bookId: integer("book_id").notNull().references(() => books.id),
  borrowDate: timestamp("borrow_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  returnDate: timestamp("return_date"),
  status: text("status").notNull(),
});
```

#### Reviews Table
```typescript
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bookId: integer("book_id").notNull().references(() => books.id),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

#### Table Relations

The relations between tables are defined using Drizzle's relations API:

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  borrowings: many(borrowings),
  reviews: many(reviews),
}));

export const booksRelations = relations(books, ({ many }) => ({
  borrowings: many(borrowings),
  reviews: many(reviews),
}));

export const borrowingsRelations = relations(borrowings, ({ one }) => ({
  user: one(users, { fields: [borrowings.userId], references: [users.id] }),
  book: one(books, { fields: [borrowings.bookId], references: [books.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  book: one(books, { fields: [reviews.bookId], references: [books.id] }),
}));
```

The schema is defined using Drizzle ORM with TypeScript types generated for frontend and backend use via the `$inferSelect` and `$inferInsert` helpers.

### Storage Interface (`server/storage.ts`)

Defines a unified interface for data operations that can be implemented with different storage mechanisms:

- `IStorage`: Interface defining all CRUD operations
- `DatabaseStorage`: Implementation using PostgreSQL with Drizzle ORM

### API Routes (`server/routes.ts`)

RESTful API endpoints for client-server communication:

- **Authentication**: User registration, login, and session management
- **Books**: CRUD operations for book management and search
- **Borrowings**: Book borrowing and return functionality
- **Reviews**: Book review and rating system

### Frontend Components

- **Header (`client/src/components/Header.tsx`)**: Navigation, search bar, and user authentication
- **BookCard (`client/src/components/BookCard.tsx`)**: Book display with cover, metadata, and actions
- **SearchBar (`client/src/components/SearchBar.tsx`)**: Search functionality for finding books
- **BookFilterBar (`client/src/components/BookFilterBar.tsx`)**: Filtering options for book discovery
- **Pagination (`client/src/components/Pagination.tsx`)**: Page navigation for book listings

### Pages

- **Home (`client/src/pages/home.tsx`)**: Main landing page with book browsing
- **Book Details (`client/src/pages/book-details.tsx`)**: Detailed book information and actions
- **Dashboard (`client/src/pages/dashboard.tsx`)**: User dashboard for borrowed books
- **Admin (`client/src/pages/admin.tsx`)**: Administrative interface for library management
- **Login/Signup (`client/src/pages/login.tsx`, `client/src/pages/signup.tsx`)**: Authentication pages

## Data Flow Architecture

### Client-Side Data Management with TanStack Query

The application uses TanStack Query (React Query) for data fetching, caching, and state management:

```typescript
// client/src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Important: allow refetching when query parameters change
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

Custom fetcher function for type-safe API requests:

```typescript
// Custom query function configuration
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const queryParams = queryKey[1] as Record<string, any> | undefined;
    
    // Build URL with query parameters
    let finalUrl = url;
    if (queryParams) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      }
      
      const queryString = params.toString();
      if (queryString) {
        finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }
    
    // Make request with credentials for auth
    const res = await fetch(finalUrl, {
      credentials: "include",
    });

    // Handle unauthorized responses
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // Parse JSON response
    await throwIfResNotOk(res);
    return await res.json();
  };
```

### Example Query Usage

```typescript
// Fetch books based on search or filters
const { data: books = [], isLoading } = useQuery<Book[]>({
  queryKey: [
    // Determine endpoint based on search parameter
    filters.search ? '/api/search' : '/api/books', 
    // Add query parameters
    filters.search 
      ? { query: filters.search }  // For search endpoint
      : { genre: filters.genre }   // For regular books endpoint
  ],
  refetchOnWindowFocus: false
});
```

### Mutation Example

```typescript
// Create book mutation
const createBook = useMutation({
  mutationFn: async (data: BookFormValues) => {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error('Failed to create book');
    }
    
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    toast({ title: "Success", description: "Book created successfully" });
    form.reset();
    setShowAddBookDialog(false);
  },
  onError: () => {
    toast({ 
      title: "Error", 
      description: "Failed to create book", 
      variant: "destructive" 
    });
  },
});
```

### Complete Data Flow

1. **Frontend Request**: React components use TanStack Query to make API requests
2. **API Routes**: Express routes handle client requests in `server/routes.ts`
3. **Storage Interface**: Routes use the storage interface to interact with the database
4. **Database Operations**: Drizzle ORM executes SQL queries against PostgreSQL
5. **Response**: Data is returned to the frontend and rendered by React components
6. **Cache Management**: TanStack Query caches results and handles stale data

## Authentication Flow

### Implementation (`server/routes.ts`)

The authentication system uses Passport.js with a local strategy and Express session:

```typescript
// Set up session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bookborrow-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  }),
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
  }),
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
```

### Authentication Middleware

```typescript
// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Not authorized" });
};
```

### Authentication Flow

1. User submits credentials via the login form (`client/src/pages/login.tsx`)
2. Frontend sends a POST request to `/api/auth/login` with username and password
3. Server validates credentials using Passport.js local strategy
4. If valid, a session is created and stored using Express Session
5. Session ID is sent to the client as a cookie
6. For subsequent requests, the client includes the session cookie
7. The server verifies the session and attaches the user object to the request
8. Protected routes use middleware to check authentication status
9. Admin routes have additional checks for the admin flag

## Core Features Implementation

### Book Search Implementation

The search functionality follows these steps:

1. User enters a search term in the `SearchBar` component (`client/src/components/SearchBar.tsx`)
2. The form submission handler navigates to the home page with a search query parameter: `navigate(`/?search=${searchTerm}`)` 
3. The `Home` component (`client/src/pages/home.tsx`) extracts the search query from the URL using the `useLocation` hook
4. The `useQuery` hook sends a request to either:
   - `/api/search` endpoint (when a search term is present)
   - `/api/books` endpoint (for regular browsing)
5. The query parameters are transformed into a URL query string by the custom `getQueryFn` in `client/src/lib/queryClient.ts`
6. The server receives the request at the `/api/search` endpoint in `server/routes.ts`
7. The `searchBooks` method in `DatabaseStorage` (`server/db-storage.ts`) performs a case-insensitive search:
   ```typescript
   // In-memory case-insensitive filtering across all relevant fields
   const results = allBooks.filter(book => 
     book.title.toLowerCase().includes(query.toLowerCase()) ||
     book.author.toLowerCase().includes(query.toLowerCase()) ||
     book.description.toLowerCase().includes(query.toLowerCase()) ||
     book.genre.toLowerCase().includes(query.toLowerCase())
   );
   ```
8. Search results are returned to the frontend and displayed in the `BookGrid` component

### Book Borrowing System

The book borrowing system works as follows:

1. User requests to borrow a book from the book details page
2. A borrowing request is sent to the backend API at `/api/books/:id/borrow`
3. The server processes the request in `server/routes.ts` and calls `storage.createBorrowing()`
4. The `createBorrowing` method in `DatabaseStorage` (`server/db-storage.ts`):
   - Updates the book's available copies (decrements by 1)
   - Creates a new borrowing record with:
     - User ID
     - Book ID
     - Borrow date (current date)
     - Due date (calculated, typically 2 weeks later)
     - Status ('borrowed')
5. When a user returns a book, the `returnBook` method:
   - Updates the book's available copies (increments by 1)
   - Updates the borrowing record with:
     - Return date (current date)
     - Status ('returned')
6. The UI reflects the borrowing status with appropriate visual indicators

## Development Workflow

1. **Setup**: Clone the repository and install dependencies
2. **Database**: Initialize PostgreSQL database and run migrations
3. **Development Server**: Run the development server with `npm run dev`
4. **Code Structure**: Follow established patterns when adding new features
5. **Type Safety**: Leverage TypeScript and Zod for type validation
6. **UI Components**: Use and extend Shadcn UI components for consistency

## Deployment

The application can be deployed using Docker containers:

- Frontend and backend are bundled together
- PostgreSQL database can be run in a separate container
- Environment variables configure database connections and other settings

## Design Decisions

- **TypeScript**: Chosen for type safety across the entire application
- **Component-based Architecture**: Clear separation of concerns
- **Drizzle ORM**: Modern, type-safe alternative to other ORMs
- **TanStack Query**: Simplified data fetching and caching
- **Shadcn UI**: Customizable, accessible components with minimal styling overhead
- **Amber Color Theme**: Warm aesthetic for a cozy book browsing experience

## Future Enhancements

- Email notifications for due dates
- Book reservation system
- Reading recommendations based on user history
- Enhanced search with filters for publication year and rating
- Mobile application for on-the-go access