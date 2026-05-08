/**
 * 共通の型定義
 */

// News関連
export interface ContentItem {
  type: "text" | "link";
  value: string;
  url?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  date: Date | string;
  contents: ContentItem[];
  url: string | null;
  color: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Blog関連
export interface BlogItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  imagePosition: "left" | "center" | "right";
  createdAt: Date;
  updatedAt: Date;
}

// API Response関連
export interface ApiErrorResponse {
  error: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

// Next.js App Router パラメータ型
export interface RouteParams<T> {
  params: Promise<T>;
}

export interface IdParams {
  id: string;
}

// ページネーション
export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}
