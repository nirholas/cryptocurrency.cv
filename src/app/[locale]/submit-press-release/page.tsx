'use client';

import { useState } from 'react';
import { PRESS_RELEASE_CATEGORIES } from '@/lib/press-release';
import { Link } from '@/i18n/navigation';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500';

export default function SubmitPressReleasePage() {
  const [form, setForm] = useState({
    projectName: '',
    projectUrl: '',
    contactEmail: '',
    contactName: '',
    title: '',
    category: PRESS_RELEASE_CATEGORIES[0],
    body: '',
    imageUrl: '',
    tier: 'free' as 'free' | 'priority' | 'featured',
    agree: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const wordCount = form.body.trim() ? form.body.trim().split(/\s+/).length : 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? (e.target as HTMLInputElement).checked : false;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const errs: string[] = [];
    if (!form.projectName.trim()) errs.push('Project name is required.');
    if (!/^https?:\/\/.+/.test(form.projectUrl))
      errs.push('Valid project website URL is required.');
    if (!/^\S+@\S+\.\S+$/.test(form.contactEmail)) errs.push('Valid contact email is required.');
    if (!form.contactName.trim()) errs.push('Contact name is required.');
    if (!form.title.trim()) errs.push('Press release title is required.');
    if (wordCount < 200 || wordCount > 3000)
      errs.push(`Press release body must be 200–3,000 words (currently ${wordCount}).`);
    if (form.imageUrl && !/^https?:\/\/.+/.test(form.imageUrl))
      errs.push('Featured image URL must be a valid URL.');
    if (!form.agree) errs.push('You must agree to the terms and guidelines.');
    if (!form.confirm) errs.push('You must confirm this is not spam or misleading content.');
    if (errs.length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/press-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: form.projectName.trim(),
          projectUrl: form.projectUrl.trim(),
          contactEmail: form.contactEmail.trim(),
          contactName: form.contactName.trim(),
          title: form.title.trim(),
          category: form.category,
          body: form.body,
          imageUrl: form.imageUrl.trim() || undefined,
          tier: form.tier,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => null);
        setErrors(
          (data?.errors ?? data?.error) ? [data.error] : ['Submission failed. Please try again.'],
        );
      }
    } catch {
      setErrors(['Network error. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
          <h1 className="mb-3 text-2xl font-bold text-green-800 dark:text-green-200">
            ✅ Press Release Submitted
          </h1>
          <p className="mb-4 text-green-700 dark:text-green-300">
            Your press release has been submitted for review. You will receive a confirmation email
            shortly.
          </p>
          <Link href="/press-releases" className="text-blue-600 hover:underline dark:text-blue-400">
            ← View all press releases
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
        📰 Submit a Press Release
      </h1>
      <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
        Get your announcement in front of thousands of crypto enthusiasts, developers, and
        investors.
      </p>

      {/* How It Works */}
      <section className="mb-8 rounded-lg border border-blue-100 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          How It Works
        </h2>
        <ol className="ml-5 list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>Submit your press release using the form below</li>
          <li>Our team reviews for quality and relevance</li>
          <li>Approved releases are published within 24h</li>
          <li>Your release appears in our feed, API, and RSS</li>
        </ol>
      </section>

      {/* Guidelines */}
      <section className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Guidelines</h2>
        <div className="grid gap-1 text-sm">
          <div className="text-green-700 dark:text-green-400">
            ✓ Must be related to cryptocurrency or blockchain
          </div>
          <div className="text-green-700 dark:text-green-400">
            ✓ Written in English (other languages accepted)
          </div>
          <div className="text-green-700 dark:text-green-400">
            ✓ No misleading claims or guaranteed returns
          </div>
          <div className="text-green-700 dark:text-green-400">
            ✓ Include project name, website, and contact info
          </div>
          <div className="text-red-600 dark:text-red-400">✗ No duplicate submissions</div>
          <div className="text-red-600 dark:text-red-400">✗ No malicious or scam projects</div>
        </div>
      </section>

      {/* Submission Form */}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Submission Form</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="projectName"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Project Name *
            </label>
            <input
              id="projectName"
              name="projectName"
              value={form.projectName}
              onChange={handleChange}
              placeholder="e.g. My Protocol"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label
              htmlFor="projectUrl"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Project Website *
            </label>
            <input
              id="projectUrl"
              name="projectUrl"
              value={form.projectUrl}
              onChange={handleChange}
              placeholder="https://example.com"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label
              htmlFor="contactEmail"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Contact Email *
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={handleChange}
              placeholder="you@example.com"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label
              htmlFor="contactName"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Contact Name *
            </label>
            <input
              id="contactName"
              name="contactName"
              value={form.contactName}
              onChange={handleChange}
              placeholder="Your name"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Press Release Title *
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Announcement headline"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className={INPUT_CLASS}
          >
            {PRESS_RELEASE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="body"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Press Release Body *{' '}
            <span className="font-normal text-gray-400">({wordCount} / 200–3,000 words)</span>
          </label>
          <textarea
            id="body"
            name="body"
            value={form.body}
            onChange={handleChange}
            placeholder="Write your press release here (minimum 200 words)…"
            rows={12}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="imageUrl"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Featured Image URL <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.png"
            className={INPUT_CLASS}
          />
        </div>

        {/* Tier selection */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Submission Tier
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { value: 'free', label: 'Free', desc: 'Published within 48h' },
                { value: 'priority', label: '$99 Priority', desc: 'Published within 4h' },
                { value: 'featured', label: '$299 Featured', desc: 'Pinned 24h + social' },
              ] as const
            ).map((tier) => (
              <label
                key={tier.value}
                className={`cursor-pointer rounded-lg border p-3 text-center transition-colors ${
                  form.tier === tier.value
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={tier.value}
                  checked={form.tier === tier.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {tier.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{tier.desc}</div>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
              className="mt-0.5"
            />
            I agree to the terms and guidelines above
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="confirm"
              checked={form.confirm}
              onChange={handleChange}
              className="mt-0.5"
            />
            I confirm this is not spam or misleading content
          </label>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <ul className="list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-300">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {submitting ? 'Submitting…' : 'Submit Press Release'}
        </button>
      </form>

      {/* Pricing */}
      <section className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Pricing</h2>
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex justify-between">
            <span>
              <strong>Free</strong> — Standard listing
            </span>
            <span>Published within 48h</span>
          </div>
          <div className="flex justify-between">
            <span>
              <strong>$99</strong> — Priority review
            </span>
            <span>Published within 4h</span>
          </div>
          <div className="flex justify-between">
            <span>
              <strong>$299</strong> — Featured placement
            </span>
            <span>Pinned for 24h + social</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/contact" className="text-blue-600 hover:underline dark:text-blue-400">
            Contact us
          </Link>{' '}
          for enterprise packages.
        </p>
      </section>
    </main>
  );
}
