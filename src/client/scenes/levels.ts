export interface LevelElement {
  type: "ground" | "spike" | "spring" | "coin" | "speed" | "shield" | "falling_block" | "rising_block" | "rotating_hazard" | "conveyor_belt" | "flickering_tile" | "fake_wall" | "control_inversion" | "sawblade" | "trampoline" | "ui_troll" | "developer_door" | "spike_spawner" | "projectile_launcher" | "falling_architecture" | "portal" | "fake_spring" | "crusher" | "rain_trigger";
  x: number;
  y: number;
  [key: string]: any;
}

export interface CampaignLevel {
  id: number;
  name: string;
  length: number;
  elements: LevelElement[];
}

export const LEVEL_1: CampaignLevel = {
  id: 1, name: "DEVIL ROOKIE", length: 600,
  elements: [ { type: "ground", x: 60, y: 450 }, { type: "ground", x: 120, y: 450 }, { type: "ground", x: 180, y: 450 }, { type: "ground", x: 240, y: 450 }, { type: "ground", x: 300, y: 450 }, { type: "ground", x: 360, y: 450 }, { type: "ground", x: 420, y: 450 } ]
};

export const LEVEL_2: CampaignLevel = {
  id: 2, name: "CHAOS WALKER", length: 600,
  elements: [ { type: "ground", x: 60, y: 450 }, { type: "ground", x: 120, y: 450 }, { type: "ground", x: 180, y: 450 }, { type: "ground", x: 240, y: 450 }, { type: "ground", x: 300, y: 450 }, { type: "ground", x: 360, y: 450 }, { type: "ground", x: 420, y: 450 } ]
};

export const LEVEL_3: CampaignLevel = {
  id: 3, name: "SPEED WALKER", length: 600,
  elements: [ { type: "ground", x: 60, y: 450 }, { type: "ground", x: 120, y: 450 }, { type: "ground", x: 180, y: 450 }, { type: "ground", x: 240, y: 450 }, { type: "ground", x: 300, y: 450 }, { type: "ground", x: 360, y: 450 }, { type: "ground", x: 420, y: 450 } ]
};

export const LEVEL_4: CampaignLevel = {
  id: 4, name: "JUNK WASTELAND", length: 600,
  elements: [ { type: "ground", x: 60, y: 450 }, { type: "ground", x: 120, y: 450 }, { type: "ground", x: 180, y: 450 }, { type: "ground", x: 240, y: 450 }, { type: "ground", x: 300, y: 450 }, { type: "ground", x: 360, y: 450 }, { type: "ground", x: 420, y: 450 } ]
};

export const CAMPAIGN_LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4];