import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { SmartDelayNode } from './SmartDelayNode';
import { RandomizerNode } from './RandomizerNode';
import { ActionNode } from './ActionNode';
import { ConditionNode } from './ConditionNode';
import { ApiCallNode } from './ApiCallNode';

const defaultNodeProps = {
  selected: false,
  zIndex: 1,
  isConnectable: true,
  positionAbsoluteX: 0,
  positionAbsoluteY: 0,
  dragging: false,
  draggable: true,
  selectable: true,
  deletable: true,
};

describe('FlowBuilder Advanced Node Components', () => {
  it('renders SmartDelayNode with duration timer', () => {
    render(
      <ReactFlowProvider>
        <SmartDelayNode
          id="delay-1"
          type="delay"
          data={{ mode: 'duration', waitAmount: 15, waitUnit: 'Minutes' }}
          {...defaultNodeProps}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('renders RandomizerNode with custom traffic split percentages', () => {
    render(
      <ReactFlowProvider>
        <RandomizerNode
          id="random-1"
          type="randomizer"
          data={{
            variations: [
              { id: 'var_0', label: 'Promo A', percentage: 70, color: '#7C3AED' },
              { id: 'var_1', label: 'Promo B', percentage: 30, color: '#B45309' },
            ],
          }}
          {...defaultNodeProps}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Promo A')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('Promo B')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('renders ActionNode with configured actions list', () => {
    render(
      <ReactFlowProvider>
        <ActionNode
          id="action-1"
          type="action"
          data={{
            actions: [
              { type: 'ADD_TAG', tagName: 'PREMIUM_MEMBER' },
              { type: 'SET_USER_FIELD', fieldName: 'Score', fieldValue: '100' },
            ],
          }}
          {...defaultNodeProps}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText('PREMIUM_MEMBER')).toBeInTheDocument();
    expect(screen.getByText('Set Score to 100')).toBeInTheDocument();
  });

  it('renders ConditionNode with filter header', () => {
    render(
      <ReactFlowProvider>
        <ConditionNode
          id="cond-1"
          type="condition"
          data={{
            branches: [
              {
                id: 'b-1',
                matchType: 'all',
                conditions: [{ id: 'c-1', variable: 'lead_score', operator: 'greater_than', value: '50' }],
              },
            ],
          }}
          {...defaultNodeProps}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText(/Lead score/i)).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders ApiCallNode with target endpoint method and url', () => {
    render(
      <ReactFlowProvider>
        <ApiCallNode
          id="api-1"
          type="api_call"
          data={{ method: 'POST', url: 'https://api.launchly.app/v1/sync' }}
          {...defaultNodeProps}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('https://api.launchly.app/v1/sync')).toBeInTheDocument();
  });
});
