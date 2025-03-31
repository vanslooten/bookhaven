import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiRequest } from "./queryClient";
import { Book, Borrowing, BorrowingWithDetails } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date: Oct 26, 2023
export function formatDate(date: Date | string): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format relative time for due dates (e.g., "3 days left" or "overdue by 2 days")
export function formatDueDate(dueDate: Date | string): string {
  if (!dueDate) return 'N/A';
  
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const formattedDate = formatDate(due);
  
  if (diffDays < 0) {
    return `${formattedDate} (overdue by ${Math.abs(diffDays)} days)`;
  } else if (diffDays === 0) {
    return `${formattedDate} (due today)`;
  } else {
    return `${formattedDate} (${diffDays} days left)`;
  }
}

// Get status class based on days left
export function getDueStatusClass(dueDate: Date | string): string {
  if (!dueDate) return '';
  
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'text-red-600 font-medium';
  } else if (diffDays <= 3) {
    return 'text-amber-600 font-medium';
  } else {
    return 'text-gray-500';
  }
}

// Get status badge class and text
export function getStatusBadge(status: string): { class: string; text: string } {
  switch (status) {
    case 'borrowed':
      return { class: 'bg-green-100 text-green-800', text: 'On Time' };
    case 'returned':
      return { class: 'bg-blue-100 text-blue-800', text: 'Returned' };
    case 'overdue':
      return { class: 'bg-red-100 text-red-800', text: 'Overdue' };
    default:
      return { class: 'bg-gray-100 text-gray-800', text: status };
  }
}

// Borrow a book
export async function borrowBook(bookId: number): Promise<{ borrowing: Borrowing; book: Book }> {
  // Set due date to 14 days from now
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  
  const response = await apiRequest('POST', '/api/borrowings', {
    bookId,
    dueDate,
  });
  
  return await response.json();
}

// Return a book
export async function returnBook(borrowingId: number): Promise<{ borrowing: Borrowing; book: Book }> {
  const response = await apiRequest('PUT', `/api/borrowings/${borrowingId}/return`, {});
  return await response.json();
}

// Add a review
export async function addReview(bookId: number, rating: number, comment: string): Promise<any> {
  const response = await apiRequest('POST', `/api/books/${bookId}/reviews`, {
    rating,
    comment,
  });
  
  return await response.json();
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Check if a book is available
export function isBookAvailable(book: Book): boolean {
  return book.availableCopies > 0;
}

// Get availability badge text and class
export function getAvailabilityBadge(book: Book): { text: string; class: string } {
  if (isBookAvailable(book)) {
    return {
      text: 'Available',
      class: 'bg-status-available text-white'
    };
  } else {
    return {
      text: 'Unavailable',
      class: 'bg-status-unavailable text-white'
    };
  }
}
