export interface Book {
  id: number;
  coverUri?: string | null;
  title: string;
  author: string;
  publication: string;
  actualPrice: number;
  discountedPrice: number;
  purchasedDate: string | null;
  readingStartDate: string | null;
  completionDate: string | null;
  isSold: boolean;
  soldDate: string | null;
  soldPrice: number;
  createdAt: string;
}

export interface WishlistBook {
  id: number;
  title: string;
  author: string;
  publication: string;
  expectedPrice: number;
  notes: string;
  addedDate: string;
}

export interface MonthlyStats {
  year: number;
  month: number;
  purchasedCount: number;
  completedCount: number;
  totalSpent: number;
}

export interface YearlyStats {
  year: number;
  purchasedCount: number;
  completedCount: number;
  totalSpent: number;
  months: MonthlyStats[];
}

export interface StatisticsSummary {
  ownedCount: number;
  completedCount: number;
  soldCount: number;
  totalSpent: number;
  totalEarnings: number;
  netSpent: number;
  monthly: MonthlySummary[];
}

export interface MonthlySummary {
  month: number;
  purchasedCount: number;
  completedCount: number;
  soldCount: number;
  netSpent: number;
}
