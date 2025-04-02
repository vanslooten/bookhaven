import { Input } from "@/components/ui/input";
import { useState, FormEvent, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface SearchBarProps {
  className?: string;
  initialValue?: string;
}

export const SearchBar = ({ className, initialValue = "" }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [, navigate] = useLocation();

  // If initialValue changes (e.g. from URL params), update the state
  useEffect(() => {
    setSearchQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Search submitted:", searchQuery);
    if (searchQuery.trim()) {
      const searchTerm = encodeURIComponent(searchQuery.trim());
      console.log("Navigating to:", `/?search=${searchTerm}`);
      // Force navigate with different URL even when searching for the same term
      const timestamp = Date.now();
      navigate(`/?search=${searchTerm}&ts=${timestamp}`);
    } else {
      console.log("Empty search, navigating to home");
      navigate("/");
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn("relative w-full max-w-2xl mx-auto", className)}
    >
      <Input
        type="text"
        placeholder="Search by title, author, or genre..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pr-10"
      />
      <button 
        type="submit"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
};

export default SearchBar;
