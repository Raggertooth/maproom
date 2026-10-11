import type { MindMap, PositionedTopic, Topic } from './types.js';

const NODE_WIDTH = 164;
const NODE_HEIGHT = 54;
const ROOT_WIDTH = 230;
const ROOT_HEIGHT = 90;

function childrenOf(map: MindMap, parentId: string): Topic[] {
  return map.topics.filter(topic => topic.parentId === parentId).sort((a, b) => a.order - b.order);
}

export function layoutMap(map: MindMap, width = 1200, height = 760): PositionedTopic[] {
  const root = map.topics.find(topic => topic.parentId === null);
  if (!root) return [];
  const centerX = width / 2;
  const centerY = height / 2;
  const branchDistance = Math.min(260, width * 0.18);
  const childDistance = Math.min(300, width * 0.22);
  const positioned: PositionedTopic[] = [{ ...root, x: centerX, y: centerY, width: ROOT_WIDTH, height: ROOT_HEIGHT, depth: 0 }];
  const branches = childrenOf(map, root.id);

  if (map.layout === 'org-chart') {
    const branchGap = Math.min(250, (width - 100) / Math.max(1, branches.length));
    branches.forEach((branch, branchIndex) => {
      const x = centerX + (branchIndex - (branches.length - 1) / 2) * branchGap;
      positioned.push({ ...branch, x, y: centerY + 160, width: NODE_WIDTH, height: NODE_HEIGHT, depth: 1 });
      childrenOf(map, branch.id).forEach((child, index, siblings) => {
        positioned.push({ ...child, x: x + (index - (siblings.length - 1) / 2) * 120, y: centerY + 300, width: 145, height: 48, depth: 2 });
      });
    });
    return positioned;
  }

  branches.forEach((branch, branchIndex) => {
    let side: -1 | 1;
    if (map.layout === 'right') side = 1;
    else if (map.layout === 'left') side = -1;
    else side = branchIndex % 2 === 0 ? -1 : 1;
    const sideBranches = branches.filter((_, index) => map.layout === 'radial' ? index % 2 === (side === -1 ? 0 : 1) : true);
    const positionInSide = sideBranches.findIndex(item => item.id === branch.id);
    const verticalGap = Math.min(270, height / Math.max(2.7, sideBranches.length));
    const y = centerY + (positionInSide - (sideBranches.length - 1) / 2) * verticalGap;
    const x = centerX + side * branchDistance;
    positioned.push({ ...branch, x, y, width: NODE_WIDTH, height: NODE_HEIGHT, depth: 1 });
    const children = childrenOf(map, branch.id);
    children.forEach((child, index) => {
      const childY = y + (index - (children.length - 1) / 2) * 68;
      positioned.push({ ...child, x: x + side * childDistance, y: childY, width: 170, height: 46, depth: 2 });
    });
  });
  return positioned;
}

export function connectionPath(source: PositionedTopic, target: PositionedTopic): string {
  const direction = target.x >= source.x ? 1 : -1;
  const sx = source.x + direction * source.width / 2;
  const tx = target.x - direction * target.width / 2;
  const bend = Math.max(50, Math.abs(tx - sx) * 0.48);
  return `M ${sx} ${source.y} C ${sx + direction * bend} ${source.y}, ${tx - direction * bend} ${target.y}, ${tx} ${target.y}`;
}
