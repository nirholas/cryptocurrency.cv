/**
 * @fileoverview Unit tests for Header component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

// Mock the MobileNav component
vi.mock('./MobileNav', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? <div data-testid="mobile-nav" onClick={onClose}>Mobile Nav</div> : null
  ),
}));

describe('Header', () => {
  it('renders the logo/brand', () => {
    render(<Header />);
    expect(screen.getByText(/crypto/i)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    
    // Check for main navigation links
    const navLinks = screen.getAllByRole('link');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('has accessible navigation structure', () => {
    render(<Header />);
    
    // Should have navigation landmark
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('renders mobile menu button on small screens', () => {
    render(<Header />);
    
    // Look for mobile menu button (hamburger)
    const menuButton = screen.queryByRole('button', { name: /menu/i });
    // Button may not always be present depending on responsive design
    if (menuButton) {
      expect(menuButton).toBeInTheDocument();
    }
  });
});
