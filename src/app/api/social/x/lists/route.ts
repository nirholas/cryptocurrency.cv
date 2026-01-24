/**
 * X/Twitter Influencer Lists API
 * 
 * Manage custom lists of influencers to track for sentiment analysis.
 * 
 * GET /api/social/x/lists - Get all lists
 * POST /api/social/x/lists - Create a new list
 * 
 * @example
 * POST /api/social/x/lists
 * {
 *   "name": "ETH Builders",
 *   "description": "Ethereum core developers and builders",
 *   "users": [
 *     { "username": "VitalikButerin", "category": "founder", "weight": 0.9 },
 *     { "username": "sassal0x", "category": "influencer", "weight": 0.8 }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllInfluencerLists,
  saveInfluencerList,
  InfluencerList,
  XUser,
  DEFAULT_CRYPTO_INFLUENCERS,
} from '@/lib/x-scraper';

const VALID_CATEGORIES = ['whale', 'influencer', 'analyst', 'developer', 'founder', 'trader'];

export async function GET() {
  try {
    const lists = await getAllInfluencerLists();

    return NextResponse.json({
      success: true,
      data: {
        lists,
        totalLists: lists.length,
        totalInfluencers: lists.reduce((acc, l) => acc + l.users.length, 0),
      },
      meta: {
        endpoint: '/api/social/x/lists',
        description: 'Manage influencer lists for X sentiment tracking',
        documentation: 'https://fcn.dev/docs/x-sentiment',
      },
    });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, users } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid name: must be 1-100 characters' },
        { status: 400 }
      );
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid users: must be a non-empty array' },
        { status: 400 }
      );
    }

    if (users.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Too many users: maximum 50 per list' },
        { status: 400 }
      );
    }

    // Validate each user
    const validatedUsers: XUser[] = [];
    for (const user of users) {
      if (!user.username || typeof user.username !== 'string') {
        return NextResponse.json(
          { success: false, error: `Invalid username: ${JSON.stringify(user)}` },
          { status: 400 }
        );
      }

      // Clean username (remove @ if present)
      const username = user.username.replace(/^@/, '').trim();
      
      // Validate username format
      if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
        return NextResponse.json(
          { success: false, error: `Invalid username format: ${username}` },
          { status: 400 }
        );
      }

      const category = user.category || 'influencer';
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { success: false, error: `Invalid category: ${category}. Valid: ${VALID_CATEGORIES.join(', ')}` },
          { status: 400 }
        );
      }

      const weight = typeof user.weight === 'number' ? Math.max(0, Math.min(1, user.weight)) : 0.5;

      validatedUsers.push({
        username,
        displayName: user.displayName,
        category: category as XUser['category'],
        weight,
      });
    }

    // Generate list ID
    const listId = `list_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newList: InfluencerList = {
      id: listId,
      name,
      description: description || '',
      users: validatedUsers,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveInfluencerList(newList);

    return NextResponse.json({
      success: true,
      data: newList,
      meta: {
        sentimentEndpoint: `/api/social/x/sentiment?list=${listId}`,
        message: 'List created successfully. Use the sentiment endpoint to get analysis.',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create list' },
      { status: 500 }
    );
  }
}
