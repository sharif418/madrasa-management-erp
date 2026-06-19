// Feedback module shared types
export type Feedback = {
  id: string;
  type: string;
  category: string;
  subject: string;
  description: string;
  submittedBy: string;
  submitterRole: string;
  contact: string | null;
  priority: string;
  status: string;
  assignedTo: string | null;
  resolution: string | null;
  rating: number | null;
  submittedAt: string;
  resolvedAt: string | null;
};

export type FeedbackData = {
  items: Feedback[];
  kpis: {
    open: number;
    resolved: number;
    avgRating: number;
    ratedCount: number;
  };
};
