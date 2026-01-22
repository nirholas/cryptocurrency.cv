'use client';

/**
 * Table Pagination Component
 * Pagination controls for the coins table
 */

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: TablePaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      
      const params = new URLSearchParams(searchParams.toString());
      if (page === 1) {
        params.delete('page');
      } else {
        params.set('page', String(page));
      }
      
      const queryString = params.toString();
      router.push(`/markets${queryString ? `?${queryString}` : ''}`);
    },
    [router, searchParams, totalPages]
  );

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // Number of pages to show on each side of current page
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border-t border-gray-200 dark:border-gray-700">
      {/* Items info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-white">{startItem}</span> to{' '}
        <span className="font-medium text-gray-900 dark:text-white">{endItem}</span> of{' '}
        <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page as number)}
                className={`min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Mobile page indicator */}
        <div className="sm:hidden px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </div>

        {/* Next button */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Quick jump to page */}
      <div className="hidden lg:flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">Go to:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          defaultValue={currentPage}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const value = parseInt((e.target as HTMLInputElement).value, 10);
              if (!isNaN(value)) {
                goToPage(value);
              }
            }
          }}
          className="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
