/**
 * @fileoverview Unit tests for NewsletterForm component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewsletterForm } from './NewsletterForm';

describe('NewsletterForm (card variant — default)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global fetch mock
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: true }),
    });
  });

  it('renders email input', () => {
    render(<NewsletterForm />);
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
  });

  it('renders Subscribe for Free button', () => {
    render(<NewsletterForm />);
    expect(screen.getByRole('button', { name: /Subscribe for Free/i })).toBeInTheDocument();
  });

  it('renders Crypto News Digest heading', () => {
    render(<NewsletterForm />);
    expect(screen.getByText('Crypto News Digest')).toBeInTheDocument();
  });

  it('renders daily and weekly frequency radio buttons', () => {
    render(<NewsletterForm />);
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(2);
    expect(screen.getByLabelText(/daily/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/weekly/i)).toBeInTheDocument();
  });

  it('shows error message when submitting empty email', async () => {
    render(<NewsletterForm />);
    const submitBtn = screen.getByRole('button', { name: /Subscribe for Free/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('Please enter your email')).toBeInTheDocument();
    });
  });

  it('shows success message after successful subscription', async () => {
    render(<NewsletterForm />);
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const submitBtn = screen.getByRole('button', { name: /Subscribe for Free/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/Thanks for subscribing/i)).toBeInTheDocument();
    });
  });

  it('shows error message when API returns failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ success: false, error: 'Email already subscribed' }),
    });
    render(<NewsletterForm />);
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Subscribe for Free/i }));
    await waitFor(() => {
      expect(screen.getByText('Email already subscribed')).toBeInTheDocument();
    });
  });

  it('shows generic error when fetch throws', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network error'));
    render(<NewsletterForm />);
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Subscribe for Free/i }));
    await waitFor(() => {
      expect(screen.getByText('Failed to subscribe. Please try again.')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    let resolveJson: (v: unknown) => void;
    const jsonPromise = new Promise((resolve) => { resolveJson = resolve; });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ json: () => jsonPromise });

    render(<NewsletterForm />);
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const submitBtn = screen.getByRole('button', { name: /Subscribe for Free/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });
    // Resolve the promise to clean up
    resolveJson!({ success: true });
  });
});

describe('NewsletterForm (inline variant)', () => {
  it('renders email input with inline placeholder', () => {
    render(<NewsletterForm variant="inline" />);
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
  });

  it('renders Subscribe button', () => {
    render(<NewsletterForm variant="inline" />);
    expect(screen.getByRole('button', { name: /Subscribe/i })).toBeInTheDocument();
  });
});

describe('NewsletterForm (banner variant)', () => {
  it('renders "Get daily crypto news in your inbox" text', () => {
    render(<NewsletterForm variant="banner" />);
    expect(screen.getByText('Get daily crypto news in your inbox')).toBeInTheDocument();
  });

  it('renders close (X) button', () => {
    render(<NewsletterForm variant="banner" />);
    // The X button is a button with no text label — find it by its position
    const buttons = screen.getAllByRole('button');
    // One Subscribe + one close button
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('hides banner when close button is clicked', async () => {
    const { container } = render(<NewsletterForm variant="banner" />);
    // Find all buttons and click the last one (the X/close button)
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons[buttons.length - 1];
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
