import { 
  Book as SchemaBook, 
  Borrowing as SchemaBorrowing, 
  User as SchemaUser,
  Review as SchemaReview
} from '@shared/schema';

// Enhanced types with additional frontend-specific properties
export type Book = SchemaBook;

export type User = Omit<SchemaUser, 'password'>;

export type Borrowing = SchemaBorrowing & {
  book?: Book;
};

export type Review = SchemaReview & {
  user?: {
    id: number;
    username: string;
    name: string;
  };
};

export type BorrowingWithDetails = Borrowing & {
  book: Book;
};

export type GenreOption = {
  value: string;
  label: string;
};

export type SortOption = {
  value: string;
  label: string;
};

export type AvailabilityOption = {
  value: string;
  label: string;
};

export type BookFilters = {
  search?: string;
  genre?: string;
  availability?: string;
  sort?: string;
};

export type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
};
