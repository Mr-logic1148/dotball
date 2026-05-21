// API response types — mirror the Pydantic models on the backend.
// Keep these in sync with backend/app/routers/*.py.

export type Phase = "powerplay" | "middle" | "death";

export interface WagonBall {
  over: number;
  ball: number;
  batter_id: string | null;
  batter_name: string | null;
  bowler_id: string | null;
  bowler_name: string | null;
  runs_batter: number;
  phase: Phase | null;
  wagon_zone: number; // 1..8
  is_boundary: boolean;
}

export interface WagonWheelResponse {
  match_id: string;
  innings_number: number;
  total_runs: number;
  total_balls: number;
  boundaries_4: number;
  boundaries_6: number;
  balls: WagonBall[];
}

export interface MatchSummary {
  id: string;
  competition: string;
  season: string | null;
  match_date: string;
  venue_id: string | null;
}
