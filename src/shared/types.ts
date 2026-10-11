export type MapLayout = 'radial' | 'right' | 'left' | 'org-chart';
export type TopicStatus = 'none' | 'planned' | 'in-progress' | 'done' | 'blocked';

export interface TopicStyle {
  color?: string;
}

export interface Topic {
  id: string;
  parentId: string | null;
  text: string;
  notes: string;
  status: TopicStatus;
  style: TopicStyle;
  order: number;
}

export interface MapLink {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

export interface MindMap {
  id: string;
  title: string;
  layout: MapLayout;
  topics: Topic[];
  links: MapLink[];
  createdAt: string;
  updatedAt: string;
}

export interface PositionedTopic extends Topic {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}
