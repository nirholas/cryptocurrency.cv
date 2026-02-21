'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  featured?: boolean;
  readingTime: string;
}

/**
 * Blog Admin Dashboard
 * 
 * Simple admin interface for viewing and managing blog posts.
 * Lists all posts with their metadata and provides quick actions.
 */
export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch('/api/blog/posts');
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const categories = ['all', ...new Set(posts.map(p => p.category))];
  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter(p => p.category === filter);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Blog Admin</h1>
            <p className="text-gray-400 mt-1">
              Manage your blog posts
            </p>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/en/blog"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              View Blog
            </Link>
            <Link 
              href="/admin/blog/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
            >
              + New Post
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{posts.length}</div>
            <div className="text-gray-400 text-sm">Total Posts</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{posts.filter(p => p.featured).length}</div>
            <div className="text-gray-400 text-sm">Featured</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <div className="text-gray-400 text-sm">Categories</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold">
              {new Set(posts.flatMap(p => p.tags)).size}
            </div>
            <div className="text-gray-400 text-sm">Tags</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filter === cat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Posts Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Reading Time</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => (
                  <tr key={post.slug} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {post.featured && (
                          <span className="text-yellow-500" title="Featured">⭐</span>
                        )}
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-gray-400 text-sm truncate max-w-md">
                            {post.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-700 rounded text-sm">
                        {post.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(post.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-400">{post.readingTime}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/en/blog/${post.slug}`}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/blog/edit/${post.slug}`}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📝 Creating Blog Posts</h2>
          <p className="text-gray-400 mb-4">
            Blog posts are stored as Markdown files in <code className="text-blue-400">/content/blog/</code>.
          </p>
          <div className="bg-gray-900 rounded p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-gray-300">{`---
title: "Your Post Title"
description: "A brief description of your post"
date: "2026-01-20"
author: team
category: guides
tags: ["tag1", "tag2"]
image: "/images/blog/your-image.jpg"
featured: false
---

Your markdown content goes here...`}</pre>
          </div>
          <div className="mt-4 text-gray-400 text-sm">
            <p><strong>Available categories:</strong> guides, tutorials, analysis, news, research, defi, bitcoin, ethereum, altcoins, trading, security</p>
            <p className="mt-2"><strong>Available authors:</strong> team, ai</p>
          </div>
        </div>
      </div>
    </div>
  );
}
