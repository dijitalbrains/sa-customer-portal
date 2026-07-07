export interface RenewalTimelineLine {
  name: string;
  technology: string;
  nickname: string;
  quantity: number;
  price: number;
}

export interface RenewalTimelineDate {
  date: string;
  display: string;
  lines: RenewalTimelineLine[];
}

export interface RenewalTimeline {
  byDate: RenewalTimelineDate[];
  years: number[];
  monthlyTotals: Record<string, number>;
}
