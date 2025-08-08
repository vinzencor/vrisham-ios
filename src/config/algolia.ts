// Algolia configuration for vrisham_customer app
export const ALGOLIA_CONFIG = {
  appId: '2OI7IZCUVQ',
  searchApiKey: '02421055a7940f66269a3e3c479e9a0e',
  writeApiKey: '92631faca035b778920e48ad003a2add', // Only for admin operations, not used in client
  indexName: 'products', // Default index name for products
  
  // Search configuration
  searchSettings: {
    hitsPerPage: 10,
    attributesToRetrieve: [
      'objectID',
      'name',
      'nameTamil',
      'description',
      'price',
      'mrp',
      'images',
      'category',
      'categoryID',
      'categoryIDs',
      'status',
      'keyword',
      'barcode',
      'farmerId',
      'incrementalQuantity',
      'maxQuantity',
      'minQuantity'
    ],
    attributesToHighlight: [
      'name',
      'nameTamil',
      'description',
      'keyword'
    ],
    attributesToSnippet: [
      'description:20'
    ],
    searchableAttributes: [
      'name',
      'nameTamil',
      'description',
      'keyword',
      'barcode'
    ],
    ranking: [
      'typo',
      'geo',
      'words',
      'filters',
      'proximity',
      'attribute',
      'exact',
      'custom'
    ],
    customRanking: [
      'desc(price)',
      'asc(name)'
    ],
    // Only show active products
    filters: 'status:active'
  },
  
  // Debounce delay for search queries (in milliseconds)
  searchDebounceMs: 300,
  
  // Maximum number of suggestions to show in dropdown
  maxSuggestions: 8
};

// Type definitions for Algolia search results
export interface AlgoliaProduct {
  objectID: string;
  name: string;
  nameTamil?: string;
  description?: string;
  price: number;
  mrp?: number;
  images?: string[];
  category?: string;
  categoryID?: string;
  categoryIDs?: string[];
  status: 'active' | 'inActive';
  keyword?: string[];
  barcode?: string;
  farmerId?: string;
  incrementalQuantity?: number;
  maxQuantity?: number;
  minQuantity?: number;
  _highlightResult?: {
    [key: string]: {
      value: string;
      matchLevel: string;
      matchedWords: string[];
    };
  };
  _snippetResult?: {
    [key: string]: {
      value: string;
      matchLevel: string;
    };
  };
}

export interface AlgoliaSearchResponse {
  hits: AlgoliaProduct[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  exhaustiveNbHits: boolean;
  query: string;
  params: string;
  processingTimeMS: number;
}
