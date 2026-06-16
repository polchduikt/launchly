export const getAutoLayoutedElements = (
  nodes: any[],
  edges: any[],
  direction: 'TB' | 'LR' = 'LR'
) => {
  if (nodes.length === 0) return { nodes, edges };

  const getNodeHeight = (node: any): number => {
    if (!node) return 150;
    if (node.type === 'START') return 130;
    if (node.type === 'MESSAGE') {
      const data = node.data || {};
      const hasImage = !!data.imageUrl;
      const hasText = !!data.text;
      const buttonsCount = Array.isArray(data.buttons) ? data.buttons.length : 0;
      let h = 80; 
      if (hasImage) h += 110;
      if (hasText) h += 60;
      h += buttonsCount * 45;
      return h;
    }
    return 150; 
  };

  const getNodeWidth = (_node?: any): number => {
    return 288; 
  };

  const spacingX = 140; 
  const spacingY = 60;  

  
  const levels: Record<string, number> = {};
  const visiting = new Set<string>();

  const getLevel = (nodeId: string): number => {
    if (levels[nodeId] !== undefined) return levels[nodeId];
    if (visiting.has(nodeId)) return 0; 

    visiting.add(nodeId);
    let maxParentLevel = -1;

    
    const parents = edges
      .filter(e => e.target === nodeId && e.source !== nodeId)
      .map(e => e.source);

    parents.forEach(parentId => {
      const parentNodeExists = nodes.some(n => n.id === parentId);
      if (parentNodeExists) {
        const parentLvl = getLevel(parentId);
        if (parentLvl > maxParentLevel) {
          maxParentLevel = parentLvl;
        }
      }
    });

    visiting.delete(nodeId);
    const nodeLvl = maxParentLevel + 1;
    levels[nodeId] = nodeLvl;
    return nodeLvl;
  };

  
  nodes.forEach(node => getLevel(node.id));

  
  const maxLevel = Math.max(...Object.values(levels), 0);
  const nodesByLevel: Record<number, string[]> = {};
  for (let l = 0; l <= maxLevel; l++) {
    nodesByLevel[l] = [];
  }
  nodes.forEach(node => {
    const lvl = levels[node.id];
    nodesByLevel[lvl].push(node.id);
  });

  const positions: Record<string, { x: number; y: number }> = {};

  
  const lvl0Ids = nodesByLevel[0] || [];
  if (direction === 'LR') {
    let currentY = 150;
    lvl0Ids.forEach((id) => {
      const node = nodes.find(n => n.id === id);
      const h = getNodeHeight(node);
      positions[id] = {
        x: 100,
        y: currentY
      };
      currentY += h + spacingY;
    });
  } else {
    let currentX = 150;
    lvl0Ids.forEach((id) => {
      const node = nodes.find(n => n.id === id);
      const w = getNodeWidth(node);
      positions[id] = {
        x: currentX,
        y: 100
      };
      currentX += w + spacingY;
    });
  }

  
  for (let l = 1; l <= maxLevel; l++) {
    const lvlIds = nodesByLevel[l] || [];

    
    const barycenters = lvlIds.map(id => {
      const parents = edges
        .filter(e => e.target === id)
        .map(e => e.source);

      let sum = 0;
      let count = 0;

      parents.forEach(pId => {
        if (positions[pId]) {
          sum += direction === 'LR' ? positions[pId].y : positions[pId].x;
          count++;
        }
      });

      return {
        id,
        barycenter: count > 0 ? sum / count : 200
      };
    });

    
    barycenters.sort((a, b) => a.barycenter - b.barycenter);
    const sortedIds = barycenters.map(b => b.id);
    nodesByLevel[l] = sortedIds;

    if (direction === 'LR') {
      const colX = l * (288 + spacingX) + 100;

      
      let parentYSum = 0;
      let parentYCount = 0;
      sortedIds.forEach(id => {
        const parents = edges.filter(e => e.target === id).map(e => e.source);
        parents.forEach(pId => {
          if (positions[pId]) {
            const pNode = nodes.find(n => n.id === pId);
            const pH = getNodeHeight(pNode);
            parentYSum += positions[pId].y + pH / 2;
            parentYCount++;
          }
        });
      });
      const centerY = parentYCount > 0 ? parentYSum / parentYCount : 250;

      
      let totalLevelHeight = 0;
      const heights = sortedIds.map(id => {
        const node = nodes.find(n => n.id === id);
        const h = getNodeHeight(node);
        totalLevelHeight += h + spacingY;
        return h;
      });
      if (totalLevelHeight > 0) totalLevelHeight -= spacingY;

      let currentY = centerY - totalLevelHeight / 2;
      sortedIds.forEach((id, idx) => {
        const h = heights[idx];
        positions[id] = {
          x: colX,
          y: currentY
        };
        currentY += h + spacingY;
      });
    } else {
      
      const rowY = l * (200 + spacingX) + 100;

      
      let parentXSum = 0;
      let parentXCount = 0;
      sortedIds.forEach(id => {
        const parents = edges.filter(e => e.target === id).map(e => e.source);
        parents.forEach(pId => {
          if (positions[pId]) {
            const pNode = nodes.find(n => n.id === pId);
            const pW = getNodeWidth(pNode);
            parentXSum += positions[pId].x + pW / 2;
            parentXCount++;
          }
        });
      });
      const centerX = parentXCount > 0 ? parentXSum / parentXCount : 400;

      
      let totalLevelWidth = 0;
      const widths = sortedIds.map(id => {
        const node = nodes.find(n => n.id === id);
        const w = getNodeWidth(node);
        totalLevelWidth += w + spacingY;
        return w;
      });
      if (totalLevelWidth > 0) totalLevelWidth -= spacingY;

      let currentX = centerX - totalLevelWidth / 2;
      sortedIds.forEach((id, idx) => {
        const w = widths[idx];
        positions[id] = {
          x: currentX,
          y: rowY
        };
        currentX += w + spacingY;
      });
    }
  }

  
  const layoutedNodes = nodes.map(node => {
    const pos = positions[node.id] || { x: 100, y: 150 };
    return {
      ...node,
      position: pos
    };
  });

  return { nodes: layoutedNodes, edges };
};
