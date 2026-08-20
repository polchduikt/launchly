import { FlowDiagram, FlowEdge, FlowNode, NodeType } from '../types/flow.types';

export class SchemaGenerator {
  static generateComplexDiagram(nodeCount: number = 100): FlowDiagram {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    nodes.push({
      id: 'node-0',
      type: 'START',
      data: { label: 'Start Flow Trigger' },
      position: { x: 100, y: 100 },
    });

    const nodeTypesPool: NodeType[] = [
      'MESSAGE',
      'BUTTON',
      'CONDITION',
      'ACTION',
      'SMART_DELAY',
      'INPUT',
      'LEAD',
      'ORDER',
      'AI',
      'API_CALL',
      'RANDOMIZER',
      'COMMENT',
    ];

    for (let i = 1; i < nodeCount; i++) {
      const type = i === nodeCount - 1 ? 'END' : nodeTypesPool[i % nodeTypesPool.length];
      const id = `node-${i}`;
      const prevId = `node-${i - 1}`;

      const nodeData = this.generateNodeData(type, i);

      nodes.push({
        id,
        type,
        data: nodeData,
        position: {
          x: 100 + (i % 10) * 220,
          y: 100 + Math.floor(i / 10) * 160,
        },
      });

      edges.push({
        id: `edge-${prevId}-to-${id}`,
        source: prevId,
        target: id,
        sourceHandle: null,
      });

      if (type === 'CONDITION' && i + 2 < nodeCount) {
        edges.push({
          id: `edge-branch-${id}-to-node-${i + 2}`,
          source: id,
          target: `node-${i + 2}`,
          sourceHandle: 'condition_false',
        });
      }
    }

    return { nodes, edges };
  }

  private static generateNodeData(type: NodeType, index: number): Record<string, any> {
    switch (type) {
      case 'MESSAGE':
        return {
          text: `Hello {{First Name}}! Step #${index}: Processing your automated request with variable {{order_id}}...`,
          buttons: [
            { id: `btn-${index}-1`, text: 'Continue', type: 'QUICK_REPLY', payload: `step_${index}_next` },
            { id: `btn-${index}-2`, text: 'Get Support', type: 'URL', url: 'https://launchly.app/support' },
          ],
        };
      case 'BUTTON':
        return {
          title: `Select an action for Step #${index}`,
          buttons: [
            { id: `btn-opt-1-${index}`, text: 'Option Alpha', payload: 'alpha' },
            { id: `btn-opt-2-${index}`, text: 'Option Beta', payload: 'beta' },
          ],
        };
      case 'CONDITION':
        return {
          field: 'user_score',
          operator: 'greater_than',
          value: '50',
        };
      case 'ACTION':
        return {
          actionType: 'ADD_TAG',
          tag: `vip_tier_${index % 5}`,
          fieldKey: 'last_interaction_step',
          fieldValue: `step_${index}`,
        };
      case 'SMART_DELAY':
        return {
          delayAmount: 1,
          delayUnit: 'SECONDS',
        };
      case 'INPUT':
        return {
          prompt: 'Please enter your phone number or email:',
          saveToVariable: 'customer_contact',
          validationType: 'EMAIL_OR_PHONE',
        };
      case 'LEAD':
        return {
          fullName: '{{First Name}} {{Last Name}}',
          email: '{{customer_contact}}',
          source: 'telegram_bot_flow',
        };
      case 'ORDER':
        return {
          orderNumber: `ORD-AUTOMATION-${index}`,
          amount: 149.99,
          currency: 'USD',
        };
      case 'AI':
        return {
          systemPrompt: 'You are an expert SaaS sales assistant.',
          userPrompt: 'Recommend product based on interest: {{customer_intent}}',
          temperature: 0.7,
        };
      case 'API_CALL':
        return {
          url: 'https://api.launchly.app/mock-webhook',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'flow_checkpoint', step: index }),
        };
      case 'RANDOMIZER':
        return {
          variants: [
            { label: 'Variant A', percentage: 50 },
            { label: 'Variant B', percentage: 50 },
          ],
        };
      case 'COMMENT':
        return {
          text: `Automation milestone checkpoint #${index}`,
        };
      case 'END':
        return {
          clearSession: true,
          completionMessage: 'Workflow completed successfully.',
        };
      default:
        return { label: `Node ${index}` };
    }
  }
}
