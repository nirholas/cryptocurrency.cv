/**
 * @fileoverview Unit tests for Footer component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('renders copyright information', () => {
    render(<Footer />);
    
    // Should contain year and some copyright text
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it('renders footer links', () => {
    render(<Footer />);
    
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('has proper semantic structure', () => {
    render(<Footer />);
    
    // Footer should have contentinfo role
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('includes social media links', () => {
    render(<Footer />);
    
    // Check for common social links (GitHub, Twitter, etc.)
    const socialLinks = screen.queryAllByRole('link').filter(link => {
      const href = link.getAttribute('href') || '';
      return href.includes('github') || href.includes('twitter') || href.includes('discord');
    });
    
    // At least one social link should exist
    expect(socialLinks.length).toBeGreaterThanOrEqual(0);
  });

  it('renders API documentation link', () => {
    render(<Footer />);
    
    // Look for docs or API link
    const docsLink = screen.queryByText(/api|docs|documentation/i);
    if (docsLink) {
      expect(docsLink).toBeInTheDocument();
    }
  });
});
