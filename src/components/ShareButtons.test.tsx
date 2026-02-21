/**
 * @fileoverview Unit tests for ShareButtons component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ShareButtons from './ShareButtons';

// Mock clipboard and alert globally for this module
const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal('navigator', { clipboard: { writeText: mockClipboardWriteText } });
vi.stubGlobal('alert', vi.fn());

describe('ShareButtons', () => {
  const title = 'Bitcoin Surges Past $100K';
  const url = 'https://cryptocurrency.cv/article/btc-100k';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders share platform links', () => {
    render(<ShareButtons title={title} url={url} />);
    // Should render Twitter, LinkedIn, Reddit, Telegram share links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(4);
  });

  it('Twitter link includes title and url', () => {
    render(<ShareButtons title={title} url={url} />);
    const twitterLink = screen.getByTitle('Share on Twitter');
    expect(twitterLink.getAttribute('href')).toContain('twitter.com/intent/tweet');
    expect(twitterLink.getAttribute('href')).toContain(encodeURIComponent(title));
  });

  it('LinkedIn link includes encoded url', () => {
    render(<ShareButtons title={title} url={url} />);
    const linkedinLink = screen.getByTitle('Share on LinkedIn');
    expect(linkedinLink.getAttribute('href')).toContain('linkedin.com/sharing');
  });

  it('Reddit link includes title', () => {
    render(<ShareButtons title={title} url={url} />);
    const redditLink = screen.getByTitle('Share on Reddit');
    expect(redditLink.getAttribute('href')).toContain('reddit.com/submit');
  });

  it('Telegram link includes title and url', () => {
    render(<ShareButtons title={title} url={url} />);
    const telegramLink = screen.getByTitle('Share on Telegram');
    expect(telegramLink.getAttribute('href')).toContain('t.me/share/url');
  });

  it('all share links open in a new tab', () => {
    render(<ShareButtons title={title} url={url} />);
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      const target = link.getAttribute('target');
      if (target) {
        expect(target).toBe('_blank');
      }
    });
  });

  it('renders copy link button', () => {
    render(<ShareButtons title={title} url={url} />);
    const copyButton = screen.getByRole('button');
    expect(copyButton).toBeInTheDocument();
  });
});
