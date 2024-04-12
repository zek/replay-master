export type Player = {
  player_id: string;
  nickname: string;
  avatar: string;
  membership: string;
  game_player_id: string;
  game_player_name: string;
  game_skill_level: number;
  anticheat_required: boolean;
};

export type Team = {
  faction_id: string;
  leader: string;
  avatar: string;
  roster: Player[];
  stats: {
    winProbability: number;
    skillLevel: {
      average: number;
      range: {
        min: number;
        max: number;
      };
    };
    rating: number;
  };
  substituted: boolean;
  name: string;
  type: string;
};

export type VotingEntity = {
  class_name: string;
  game_location_id?: string;
  game_map_id?: string;
  guid: string;
  image_lg: string;
  image_sm: string;
  name: string;
};

export type MatchResponse = {
  match_id: string;
  version: number;
  game: string;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: Record<'faction1' | 'faction2', Team>;
  voting: {
    location?: {
      entities: VotingEntity[];
      pick: string[];
    };
    map?: {
      entities: VotingEntity[];
      pick: string[];
    };
    voted_entity_types: string[];
  };
  calculate_elo: boolean;
  configured_at: number;
  started_at: number;
  finished_at: number;
  demo_url: string[];
  chat_room_id: string;
  best_of: number;
  results: {
    winner: string;
    score: {
      faction1: number;
      faction2: number;
    };
  };
  detailed_results: {
    asc_score: boolean;
    winner: string;
    factions: {
      faction1: {
        score: number;
      };
      faction2: {
        score: number;
      };
    };
  }[];
  status: string;
  faceit_url: string;
};