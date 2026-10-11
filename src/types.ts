export interface Game {
  id: string;
  name: string;
  created_at: string;
  participant_count?: number;
}

export interface Participant {
  id: string;
  name: string;
  age: number;
  class: string;
  section: string | null;
  created_at: string;
  games_count?: number;
}

export interface ParticipationRecord {
  id: string;
  participant_id: string;
  game_id: string;
  created_at: string;
}

export interface DashboardStats {
  gamesCount: number;
  participantsCount: number;
  selectionsCount: number;
}

export type ActiveTab = 'participation' | 'games' | 'participants';

export const STANDARD_CLASSES = [
  'LKG',
  'UKG',
  '1st Standard',
  '2nd Standard',
  '3rd Standard',
  '4th Standard',
  '5th Standard',
  '6th Standard',
  '7th Standard',
  '8th Standard',
  '9th Standard',
  '10th Standard',
  '11th Standard',
  '12th Standard',
  'Other',
] as const;
