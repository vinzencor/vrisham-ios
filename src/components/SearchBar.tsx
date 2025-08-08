import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ArrowRight, Loader2, Package, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSearchSuggestions, SearchSuggestion, formatPrice, AlgoliaSearchError } from '../services/algoliaService';

interface RecentSearch {
  type: 'recent';
  text: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Track screen width for responsive placeholder text
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get responsive placeholder text based on screen width
  const getPlaceholderText = () => {
    if (screenWidth < 400) {
      return "Search products..."; // Very small screens
    } else if (screenWidth < 640) {
      return "Search items..."; // Mobile screens
    } else {
      return "Search vegetables, fruits, staples..."; // Desktop/tablet
    }
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('vrisham_recent_searches');
    if (savedSearches) {
      try {
        const parsed = JSON.parse(savedSearches);
        setRecentSearches(parsed.slice(0, 5)); // Keep only last 5 searches
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = useCallback((searchTerm: string) => {
    const newSearch: RecentSearch = { type: 'recent', text: searchTerm };
    const updatedSearches = [newSearch, ...recentSearches.filter(s => s.text !== searchTerm)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('vrisham_recent_searches', JSON.stringify(updatedSearches));
  }, [recentSearches]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Use a proper debounce with a higher threshold to prevent shaking
    let scrollTimeout: NodeJS.Timeout;
    let ticking = false;

    const controlSearchBar = () => {
      const currentScrollY = window.scrollY;

      // Don't update if we're already processing a scroll event
      if (!ticking) {
        // Use requestAnimationFrame for smoother performance
        window.requestAnimationFrame(() => {
          const scrollDifference = Math.abs(currentScrollY - lastScrollY);

          // Only respond to significant scroll changes (15px threshold)
          if (scrollDifference > 15) {
            // Clear any pending timeouts
            if (scrollTimeout) clearTimeout(scrollTimeout);

            if (currentScrollY > lastScrollY + 20) {
              // Scrolling down significantly
              setScrollDirection('down');
              if (!isFocused) {
                setIsMinimized(true);
              }
            } else if (currentScrollY < lastScrollY - 20) {
              // Scrolling up significantly
              setScrollDirection('up');
              setIsMinimized(false);
            }

            // Update last scroll position with a longer delay
            scrollTimeout = setTimeout(() => {
              setLastScrollY(currentScrollY);
            }, 100);
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    // Use passive event listener for better performance
    window.addEventListener('scroll', controlSearchBar, { passive: true });

    return () => {
      window.removeEventListener('scroll', controlSearchBar);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [lastScrollY, isFocused]);

  // Debounced search function
  const debouncedSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    try {
      setIsLoading(true);
      setSearchError(null);
      const results = await getSearchSuggestions(searchTerm.trim());
      setSuggestions(results);

      // If no results and no error, show a helpful message
      if (results.length === 0) {
        setSearchError('No products found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof AlgoliaSearchError) {
        setSearchError('Search service temporarily unavailable. Showing local results.');
      } else {
        setSearchError('Search temporarily unavailable. Please try again.');
      }
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedSuggestionIndex(-1);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      debouncedSearch(value);
    }, 300);
  }, [debouncedSearch]);

  // Handle search submission
  const handleSearch = async (searchText: string = query) => {
    if (!searchText || !searchText.trim()) return;

    const trimmedQuery = searchText.trim();
    saveToRecentSearches(trimmedQuery);
    setIsFocused(false);
    setSuggestions([]);
    navigate(`/categories?search=${encodeURIComponent(trimmedQuery)}`);
  };

  // Handle suggestion click - navigate to product details
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    saveToRecentSearches(suggestion.name);
    setIsFocused(false);
    setSuggestions([]);
    setQuery('');
    // Navigate to product details page using the product ID
    navigate(`/product/${suggestion.id}`);
  };

  // Handle recent search click
  const handleRecentSearchClick = (recentSearch: RecentSearch) => {
    setQuery(recentSearch.text);
    handleSearch(recentSearch.text);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalSuggestions = suggestions.length + recentSearches.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < totalSuggestions - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        // Handle selection
        if (selectedSuggestionIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          const recentIndex = selectedSuggestionIndex - suggestions.length;
          handleRecentSearchClick(recentSearches[recentIndex]);
        }
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setSelectedSuggestionIndex(-1);
      inputRef.current?.blur();
    }
  }, [suggestions, recentSearches, selectedSuggestionIndex, handleSearch, handleSuggestionClick, handleRecentSearchClick]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setSearchError(null);
    setSelectedSuggestionIndex(-1);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={searchRef}
      className="sticky top-[57px] z-40 will-change-transform transform-gpu"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-white shadow-sm -z-10" />

        <div className={`max-w-2xl mx-auto px-4 transition-height duration-200 ease-out ${isMinimized ? 'py-1' : 'py-3'}`}>
          <div className="relative">
            {/* Search Input */}
            <div
              className="relative transform-gpu"
              onClick={() => {
                if (isMinimized) {
                  setIsMinimized(false);
                  inputRef.current?.focus();
                }
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => {
                  setIsFocused(true);
                  setSelectedSuggestionIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholderText()}
                className={`w-full bg-white rounded-2xl border transition-colors duration-200 ease-out
                  text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm md:placeholder:text-base
                  pl-10 sm:pl-12 pr-20 sm:pr-24
                  ${isFocused
                    ? 'border-primary shadow-md'
                    : 'border-primary/30 shadow-sm hover:border-primary'
                  }
                  ${isMinimized && !isFocused ? 'py-2' : 'py-3'}
                  focus:outline-none focus:ring-1 focus:ring-primary/30`}
                autoComplete="off"
              />

              {/* Left Icon */}
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-spin" />
                ) : (
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                )}
              </div>

              {/* Right Icons */}
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                <AnimatePresence>
                  {query && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      onClick={clearSearch}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Search Button */}
                <button
                  onClick={() => handleSearch()}
                  className={`rounded-xl text-white font-medium transition-colors ${
                    query.trim() ? 'bg-primary hover:bg-primary/90' : 'bg-gray-300 cursor-not-allowed'
                  } px-2 sm:px-4 py-1.5 text-xs sm:text-sm`}
                  disabled={!query.trim()}
                  aria-label="Search"
                >
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Go</span>
                </button>
              </div>
            </div>

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {isFocused && (suggestions.length > 0 || recentSearches.length > 0 || searchError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-80 sm:max-h-96 overflow-y-auto backdrop-blur-sm"
                >
                  {/* Error State */}
                  {searchError && (
                    <div className="p-4 text-center">
                      <div className="text-red-500 text-sm bg-red-50 rounded-lg p-3 border border-red-100">
                        {searchError}
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoading && query.length >= 2 && (
                    <div className="p-6 text-center">
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
                        <div className="text-sm text-gray-600 font-medium">Searching products...</div>
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {!isLoading && suggestions.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-semibold text-primary px-3 py-2 bg-primary/5 border-b border-primary/10">
                        Products ({suggestions.length})
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-primary/5 rounded-xl text-left transition-all duration-200 ${
                            selectedSuggestionIndex === index ? 'bg-primary/10 border border-primary/30 shadow-sm' : 'hover:shadow-sm'
                          }`}
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
                            {suggestion.image ? (
                              <img
                                src={suggestion.image}
                                alt={suggestion.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <Package className={`w-5 h-5 text-gray-400 ${suggestion.image ? 'hidden' : ''}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-medium text-gray-900 truncate text-xs sm:text-sm"
                              dangerouslySetInnerHTML={{ __html: suggestion.highlightedName || suggestion.name }}
                            />
                            {suggestion.category && (
                              <div className="text-xs text-gray-500 truncate hidden sm:block">{suggestion.category}</div>
                            )}
                            <div className="text-xs sm:text-sm font-bold text-primary bg-primary/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                              {formatPrice(suggestion.price)}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Recent Searches */}
                  {!isLoading && recentSearches.length > 0 && (query.length < 2 || suggestions.length === 0) && (
                    <div className={`p-2 ${suggestions.length > 0 ? 'border-t border-gray-100' : ''}`}>
                      <div className="text-xs font-semibold text-gray-600 px-3 py-2 bg-gray-50 border-b border-gray-100">
                        Recent Searches
                      </div>
                      {recentSearches.map((recentSearch, index) => {
                        const adjustedIndex = suggestions.length + index;
                        return (
                          <button
                            key={index}
                            onClick={() => handleRecentSearchClick(recentSearch)}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-left transition-all duration-200 ${
                              selectedSuggestionIndex === adjustedIndex ? 'bg-gray-100 border border-gray-200 shadow-sm' : 'hover:shadow-sm'
                            }`}
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Search className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="flex-1 text-gray-700 text-sm">{recentSearch.text}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* No Results */}
                  {!isLoading && query.length >= 2 && suggestions.length === 0 && !searchError && (
                    <div className="p-6 text-center">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                        <div className="text-sm text-gray-600 font-medium">No products found for "{query}"</div>
                        <div className="text-xs text-gray-400 mt-2">Try a different search term</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}