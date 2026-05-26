// Mirror of the backend Pydantic models.

export interface IplTeam {
  id: string;
  name: string;
}

export interface UserTeam {
  id: string;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  dob: string;
  favorite_team: UserTeam | null;
  team_changed_this_season: boolean;
}

export type MatchStatus =
  | "upcoming"
  | "live"
  | "won"
  | "lost"
  | "tied"
  | "no_match";

export interface TodayMatch {
  status: MatchStatus;
  user_team_id: string;
  user_team_name: string;
  opponent_team_id: string | null;
  opponent_team_name: string | null;
  venue: string | null;
  start_time: string | null;
  user_team_score: string | null;
  opponent_score: string | null;
  result_summary: string | null;
  message: string;
}

// Hardcoded brand colors per IPL team, used by UI for backgrounds, glows, and team chips.
export const IPL_BRANDS: Record<
  string,
  { primary: string; secondary: string; short: string }
> = {
  csk: { primary: "#F9CD05", secondary: "#0081E9", short: "CSK" },
  mi: { primary: "#004B8D", secondary: "#D1AB3E", short: "MI" },
  rcb: { primary: "#DA1818", secondary: "#000000", short: "RCB" },
  kkr: { primary: "#3A225D", secondary: "#F2C12E", short: "KKR" },
  dc: { primary: "#17449B", secondary: "#EF1C25", short: "DC" },
  srh: { primary: "#FB643E", secondary: "#000000", short: "SRH" },
  rr: { primary: "#EA1A85", secondary: "#254AA5", short: "RR" },
  pbks: { primary: "#DD1F2D", secondary: "#A57A2C", short: "PBKS" },
  gt: { primary: "#1B2133", secondary: "#B5A157", short: "GT" },
  lsg: { primary: "#005CB9", secondary: "#FFCC00", short: "LSG" },
};
