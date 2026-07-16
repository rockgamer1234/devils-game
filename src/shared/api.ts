// Standard structures shared between the client React HUD and Hono backend
export type LeaderboardEntry = {
  member?: string;
  name: string;
  score: number;
  coins: number;
};

export type UserProfile = {
  name: string;
  rank: number | null;
  score: number;
};

export type CustomLevel = {
  id: string;
  name: string;
  creator: string;
  elements: any[];
};

export type InitResponse = {
  type: "init";
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: "increment";
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: "decrement";
  postId: string;
  count: number;
};