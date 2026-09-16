import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const ProblemChild: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Simulated UI rendering crash');
  }
  return <div>Healthy Component Content</div>;
};

describe('ErrorBoundary Component', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Healthy Component Content')).toBeInTheDocument();
  });

  it('catches render error and displays application error fallback card', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText(/Simulated UI rendering crash/)).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('renders inline fallback card with custom title and retry button', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onResetMock = vi.fn();

    render(
      <ErrorBoundary
        inline
        fallbackTitle="Custom Panel Error"
        fallbackDescription="Specific component failed"
        onReset={onResetMock}
      >
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Panel Error')).toBeInTheDocument();
    expect(screen.getByText('Specific component failed')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();

    screen.getByText('Retry').click();
    expect(onResetMock).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  it('renders functional fallback if provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={(err) => <div>Custom Function: {err.message}</div>}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Function: Simulated UI rendering crash')).toBeInTheDocument();

    spy.mockRestore();
  });
});
