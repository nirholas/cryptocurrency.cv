/**
 * Email Provider Abstraction
 *
 * Defines a common interface for sending emails and provides:
 *   - ResendProvider  — Production email via Resend API
 *   - ConsoleProvider — Development fallback (logs to stdout)
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailProvider {
  send(params: SendEmailParams): Promise<{ id: string }>;
}

/**
 * Resend-based email provider.
 * Requires RESEND_API_KEY environment variable.
 */
export class ResendProvider implements EmailProvider {
  private readonly apiKey: string;
  private readonly from: string;

  constructor(apiKey: string, from?: string) {
    this.apiKey = apiKey;
    this.from = from || process.env.EMAIL_FROM || 'Crypto Vision News <noreply@cryptocurrency.cv>';
  }

  async send(params: SendEmailParams): Promise<{ id: string }> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
        tags: params.tags,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => String(response.status));
      throw new Error(`Resend API error (${response.status}): ${body}`);
    }

    const data = await response.json();
    return { id: data.id };
  }
}

/**
 * Console-based email provider for development.
 * Logs email details to stdout instead of sending.
 */
export class ConsoleProvider implements EmailProvider {
  async send(params: SendEmailParams): Promise<{ id: string }> {
    const id = `console_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.info('[EMAIL][ConsoleProvider] Would send email:');
    console.info(`  To:      ${params.to}`);
    console.info(`  Subject: ${params.subject}`);
    console.info(`  ID:      ${id}`);
    if (params.text) {
      console.info(`  Text:    ${params.text.slice(0, 200)}...`);
    }
    return { id };
  }
}
