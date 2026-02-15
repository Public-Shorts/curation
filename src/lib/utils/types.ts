export type Tag = { label: string; value: string };

export interface Review {
    _id: string;
    selection: 'selected' | 'maybe' | 'notSelected';
    rating?: number;
    curatorId: string;
    curatorName?: string;
    contentNotes?: string[];
}

export interface Flag {
    label: string;
    details?: string;
    color: string;
}

export interface Movie {
    _id: string;
    englishTitle: string;
    directorName: string;
    length: number; // in minutes
    poster?: any;
    // Submission Flags
    explicit?: boolean;
    explicitDetails?: string;
    aiUsed?: boolean;
    aiExplanation?: string;
    // Relationships
    reviews?: Review[];
    // Computed
    score?: number;
    reviewsCount?: number;
    flags?: Flag[];
}

export interface CuratorStats {
    totalReviews: number;
    approvedCount: number;
    approvalRate: number;
}

export interface SelectionStats {
    total: number;
    totalTime: string; // Formatted e.g. "5h 30m"
    selected: number;
    selectedTime: string;
    maybe: number;
    maybeTime: string;
    rejected: number;
    rejectedTime: string;
    highlighted?: number;
}
