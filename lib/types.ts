export interface TripRequest {
  description?: string;
  images?: string[];
  params?: {
    destination?: string;
    days?: number;
    budget?: number;
    travelers?: number;
    preferences?: string[];
  };
}

export interface TripPlan {
  title: string;
  summary: string;
  destination: string;
  days: DayPlan[];
  budget: BudgetBreakdown;
}

export interface DayPlan {
  day: number;
  date?: string;
  theme: string;
  items: ItineraryItem[];
}

export interface ItineraryItem {
  type: "attraction" | "restaurant" | "hotel" | "transport";
  name: string;
  description: string;
  time: string;
  duration: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  cost: number;
  rating?: number;
  tips?: string;
  transportToNext?: {
    mode: "walking" | "driving" | "transit" | "cycling";
    duration: number;
    distance: number;
    cost: number;
  };
}

export interface BudgetBreakdown {
  total: number;
  perPerson: number;
  transport: number;
  accommodation: number;
  food: number;
  tickets: number;
  other: number;
}

export interface ProgressEvent {
  type: "progress";
  stage: string;
  message: string;
}

export interface CompleteEvent {
  type: "complete";
  plan: TripPlan;
}

export type SSEEvent = ProgressEvent | CompleteEvent;
