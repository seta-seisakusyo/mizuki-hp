"use client";

import { useMemo } from "react";

interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
}

interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  paginatedItems: (items: T[]) => T[];
  pageNumbers: number[];
}

/**
 * ページネーションロジックを共通化するhook
 */
export function usePagination<T>({
  totalItems,
  itemsPerPage,
  currentPage,
}: UsePaginationOptions): UsePaginationResult<T> {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const hasPrevPage = validCurrentPage > 1;
  const hasNextPage = validCurrentPage < totalPages;

  const paginatedItems = useMemo(() => {
    return (items: T[]) => items.slice(startIndex, endIndex);
  }, [startIndex, endIndex]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return {
    currentPage: validCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    hasPrevPage,
    hasNextPage,
    paginatedItems,
    pageNumbers,
  };
}

/**
 * サーバーサイドでページネーションを計算するユーティリティ
 */
export function calculatePagination(
  totalItems: number,
  itemsPerPage: number,
  requestedPage: number
) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}
