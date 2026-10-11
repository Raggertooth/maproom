import type { MindMap, TopicStatus } from './types.js';

const now = new Date('2026-10-11T00:00:00.000Z').toISOString();

const branchColors = {
  research: '#77a77d',
  build: '#e77c3f',
  launch: '#4d8cc9',
  learn: '#9a55a5',
};

type SeedTopic = [string, string | null, string, string, string, TopicStatus?];
const rows: SeedTopic[] = [
  ['root', null, 'Launch a mindful product', 'A healthier, more human approach to building products that create lasting value.', '#3b82d0', 'in-progress'],
  ['research', 'root', 'Research', 'Understand the people and the problem before committing to a solution.', branchColors.research, 'in-progress'],
  ['research-users', 'research', 'Understand users', 'Interview users and observe their current workflow.', branchColors.research],
  ['research-market', 'research', 'Analyse market', '', branchColors.research],
  ['research-value', 'research', 'Define value proposition', '', branchColors.research],
  ['research-stakeholders', 'research', 'Map stakeholders', '', branchColors.research],
  ['build', 'root', 'Build', '', branchColors.build, 'planned'],
  ['build-design', 'build', 'Design experience', '', branchColors.build],
  ['build-mvp', 'build', 'Develop MVP', '', branchColors.build],
  ['build-test', 'build', 'Test with users', '', branchColors.build],
  ['build-scale', 'build', 'Prepare for scale', '', branchColors.build],
  ['launch', 'root', 'Launch', '', branchColors.launch, 'planned'],
  ['launch-market', 'launch', 'Go to market', '', branchColors.launch],
  ['launch-teams', 'launch', 'Enable teams', '', branchColors.launch],
  ['launch-signals', 'launch', 'Track early signals', '', branchColors.launch],
  ['launch-iterate', 'launch', 'Iterate quickly', '', branchColors.launch],
  ['learn', 'root', 'Learn', '', branchColors.learn, 'planned'],
  ['learn-impact', 'learn', 'Measure impact', '', branchColors.learn],
  ['learn-feedback', 'learn', 'Gather feedback', '', branchColors.learn],
  ['learn-doc', 'learn', 'Document learnings', '', branchColors.learn],
  ['learn-next', 'learn', 'Plan next steps', '', branchColors.learn],
];

export const seedMap: MindMap = {
  id: 'launch-a-mindful-product',
  title: 'Launch a mindful product',
  layout: 'radial',
  topics: rows.map(([id, parentId, text, notes, color, status = 'none'], index) => ({
    id,
    parentId,
    text,
    notes,
    status,
    style: { color },
    order: index,
  })),
  links: [
    {
      id: 'feedback-loop',
      sourceId: 'build-test',
      targetId: 'learn-feedback',
      label: 'Feeds insights',
    },
  ],
  createdAt: now,
  updatedAt: now,
};
