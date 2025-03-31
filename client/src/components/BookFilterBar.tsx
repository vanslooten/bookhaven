import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookFilters, GenreOption, SortOption, AvailabilityOption } from "@/lib/types";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface BookFilterBarProps {
  filters: BookFilters;
  onFilterChange: (filters: BookFilters) => void;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "title_asc", label: "Title: A-Z" },
  { value: "title_desc", label: "Title: Z-A" },
  { value: "recent", label: "Recently Added" },
  { value: "rating", label: "Popularity" },
];

const AVAILABILITY_OPTIONS: AvailabilityOption[] = [
  { value: "all", label: "All" },
  { value: "available", label: "Available Now" },
  { value: "unavailable", label: "Currently Unavailable" },
];

export const BookFilterBar = ({ filters, onFilterChange }: BookFilterBarProps) => {
  // Fetch genres from the API
  const { data: genres = [] } = useQuery<string[]>({
    queryKey: ['/api/genres'],
  });

  const genreOptions: GenreOption[] = [
    { value: "all", label: "All Genres" },
    ...genres.map(genre => ({ value: genre, label: genre })),
  ];

  const handleGenreChange = (value: string) => {
    onFilterChange({
      ...filters,
      genre: value,
    });
  };

  const handleAvailabilityChange = (value: string) => {
    onFilterChange({
      ...filters,
      availability: value,
    });
  };

  const handleSortChange = (value: string) => {
    onFilterChange({
      ...filters,
      sort: value,
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-neutral-dark mb-2 sm:mb-0">Book Catalog</h2>
      
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="genre" className="text-sm font-medium text-gray-600 mr-2">
            Genre
          </label>
          <Select
            value={filters.genre || "all"}
            onValueChange={handleGenreChange}
          >
            <SelectTrigger id="genre" className="w-[150px]">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent>
              {genreOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label htmlFor="availability" className="text-sm font-medium text-gray-600 mr-2">
            Availability
          </label>
          <Select
            value={filters.availability || "all"}
            onValueChange={handleAvailabilityChange}
          >
            <SelectTrigger id="availability" className="w-[150px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label htmlFor="sort" className="text-sm font-medium text-gray-600 mr-2">
            Sort By
          </label>
          <Select
            value={filters.sort || "recent"}
            onValueChange={handleSortChange}
          >
            <SelectTrigger id="sort" className="w-[150px]">
              <SelectValue placeholder="Recently Added" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default BookFilterBar;
