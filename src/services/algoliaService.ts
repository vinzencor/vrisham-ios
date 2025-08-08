import algoliasearch from 'algoliasearch';
import { ALGOLIA_CONFIG, AlgoliaProduct, AlgoliaSearchResponse } from '../config/algolia';

// Initialize Algolia client
const searchClient = algoliasearch(ALGOLIA_CONFIG.appId, ALGOLIA_CONFIG.searchApiKey);
const index = searchClient.initIndex(ALGOLIA_CONFIG.indexName);

// Search interface for UI components
export interface SearchSuggestion {
  id: string;
  name: string;
  nameTamil?: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  highlightedName?: string;
  highlightedDescription?: string;
}

// Error types
export class AlgoliaSearchError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'AlgoliaSearchError';
  }
}

// Main search function
export const searchProducts = async (
  query: string,
  options: {
    hitsPerPage?: number;
    page?: number;
    filters?: string;
  } = {}
): Promise<{
  suggestions: SearchSuggestion[];
  totalHits: number;
  totalPages: number;
  currentPage: number;
}> => {
  try {
    if (!query || query.trim().length === 0) {
      return {
        suggestions: [],
        totalHits: 0,
        totalPages: 0,
        currentPage: 0
      };
    }

    const searchOptions = {
      ...ALGOLIA_CONFIG.searchSettings,
      hitsPerPage: options.hitsPerPage || ALGOLIA_CONFIG.maxSuggestions,
      page: options.page || 0,
      filters: options.filters || ALGOLIA_CONFIG.searchSettings.filters
    };

    console.log('Searching Algolia with query:', query, 'options:', searchOptions);

    const response: AlgoliaSearchResponse = await index.search(query, searchOptions);
    
    console.log('Algolia search response:', {
      nbHits: response.nbHits,
      query: response.query,
      processingTimeMS: response.processingTimeMS
    });

    // Transform Algolia results to UI-friendly format
    const suggestions: SearchSuggestion[] = response.hits.map((hit: AlgoliaProduct) => ({
      id: hit.objectID,
      name: hit.name,
      nameTamil: hit.nameTamil,
      description: hit.description,
      price: hit.price,
      image: hit.images && hit.images.length > 0 ? hit.images[0] : undefined,
      category: hit.category,
      highlightedName: hit._highlightResult?.name?.value || hit.name,
      highlightedDescription: hit._snippetResult?.description?.value || hit.description
    }));

    return {
      suggestions,
      totalHits: response.nbHits,
      totalPages: response.nbPages,
      currentPage: response.page
    };

  } catch (error) {
    console.error('Algolia search error:', error);
    throw new AlgoliaSearchError(
      'Failed to search products. Please try again.',
      error
    );
  }
};

// Get search suggestions for autocomplete (limited results)
export const getSearchSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  try {
    const result = await searchProducts(query, {
      hitsPerPage: ALGOLIA_CONFIG.maxSuggestions
    });
    return result.suggestions;
  } catch (error) {
    console.error('Error getting search suggestions:', error);

    // If it's a network error or Algolia is down, try fallback
    if (error instanceof AlgoliaSearchError) {
      console.log('Algolia search failed, attempting fallback...');
      return await getFallbackSearchSuggestions(query);
    }

    // Return empty array on other errors to prevent UI breaking
    return [];
  }
};

// Fallback search function using local Firebase search
export const getFallbackSearchSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  try {
    // Import Firebase products service dynamically to avoid circular dependencies
    const { getAllProducts } = await import('../firebase/products');

    console.log('Using fallback search for query:', query);
    const products = await getAllProducts();

    // Simple client-side filtering
    const filtered = products
      .filter(product => {
        const searchTerm = query.toLowerCase();
        return (
          product.name?.toLowerCase().includes(searchTerm) ||
          product.nameTamil?.toLowerCase().includes(searchTerm) ||
          (product.keyword && Array.isArray(product.keyword) &&
           product.keyword.some(k => k?.toLowerCase().includes(searchTerm))) ||
          product.description?.toLowerCase().includes(searchTerm)
        );
      })
      .slice(0, ALGOLIA_CONFIG.maxSuggestions)
      .map(product => ({
        id: product.id,
        name: product.name || 'Unknown Product',
        nameTamil: product.nameTamil,
        description: product.description,
        price: product.price || 0,
        image: product.images && product.images.length > 0 ? product.images[0] : undefined,
        category: product.category
      }));

    console.log(`Fallback search found ${filtered.length} results`);
    return filtered;
  } catch (fallbackError) {
    console.error('Fallback search also failed:', fallbackError);
    return [];
  }
};

// Search with pagination for full results page
export const searchProductsWithPagination = async (
  query: string,
  page: number = 0,
  hitsPerPage: number = 20
): Promise<{
  suggestions: SearchSuggestion[];
  totalHits: number;
  totalPages: number;
  currentPage: number;
}> => {
  return searchProducts(query, { page, hitsPerPage });
};

// Get product by ID (for navigation)
export const getProductById = async (productId: string): Promise<AlgoliaProduct | null> => {
  try {
    const response = await index.getObject(productId);
    return response as AlgoliaProduct;
  } catch (error) {
    console.error('Error getting product by ID:', error);
    return null;
  }
};

// Health check function to test Algolia connection
export const testAlgoliaConnection = async (): Promise<boolean> => {
  try {
    // Perform a simple search to test connection
    await index.search('', { hitsPerPage: 1 });
    return true;
  } catch (error) {
    console.error('Algolia connection test failed:', error);
    return false;
  }
};

// Utility function to highlight search terms in text
export const highlightSearchTerms = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-800 px-1 rounded">$1</mark>');
};

// Format price for display
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
};
