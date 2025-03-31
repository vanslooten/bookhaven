import { Input } from "@/components/ui/input";
import { useState, FormEvent, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

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
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
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
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
      >
        <i className="fas fa-search"></i>
      </button>
    </form>
  );
};

export default SearchBar;
