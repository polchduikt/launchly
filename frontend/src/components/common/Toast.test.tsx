import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ToastContainer } from './Toast';
import { useToastStore, toast } from '../../store/useToastStore';

describe('ToastContainer', () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders toasts when added', () => {
    render(<ToastContainer />);
    act(() => {
      toast.success('Connected successfully');
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Connected successfully')).toBeInTheDocument();
  });

  it('dismisses toast when close button clicked', () => {
    render(<ToastContainer />);
    act(() => {
      toast.error('Connection failed');
    });

    const closeBtn = screen.getByRole('button', { name: /close notification/i });
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByText('Connection failed')).not.toBeInTheDocument();
  });
});
