/**
 * 共通の型定義
 */

// Blog関連
export interface BlogItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  imagePosition: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// お知らせ（公開ページで表示する形）
export interface NewsItem {
  id: number;
  /** ISO 8601 */
  date: string;
  title: string;
  /** 本文を行ごとに分けたもの */
  lines: string[];
  url: string | null;
  color: string;
  pinned: boolean;
}

// Next.js App Router パラメータ型
export interface RouteParams<T> {
  params: Promise<T>;
}

export interface IdParams {
  id: string;
}
