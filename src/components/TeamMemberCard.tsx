import { type TeamMember } from '@/data/team';
import { Github, Twitter, Linkedin } from 'lucide-react';

interface Props {
  member: TeamMember;
  featured?: boolean;
}

export function TeamMemberCard({ member, featured }: Props) {
  const avatarUrl =
    member.avatarUrl ??
    (member.githubUsername
      ? `https://github.com/${member.githubUsername}.png?size=160`
      : undefined);

  return (
    <div
      className={`flex ${featured ? 'flex-row gap-6' : 'flex-col items-center'} border-border bg-surface-secondary hover:border-accent/50 rounded-xl border p-6 transition-colors`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={member.name}
          width={featured ? 96 : 80}
          height={featured ? 96 : 80}
          className={`rounded-full ${featured ? 'h-24 w-24' : 'mb-3 h-20 w-20'} shrink-0`}
        />
      ) : (
        <div
          className={`bg-accent/10 flex items-center justify-center rounded-full text-3xl ${featured ? 'h-24 w-24' : 'mb-3 h-20 w-20'} shrink-0`}
        >
          👤
        </div>
      )}
      <div className={featured ? '' : 'text-center'}>
        <div className="text-text-primary text-lg font-bold">{member.name}</div>
        <div className="text-accent mb-1 text-sm font-medium">{member.role}</div>
        {member.bio && (
          <p className="text-text-secondary mb-3 text-sm leading-relaxed">{member.bio}</p>
        )}
        <div className="flex justify-center gap-3">
          {member.githubUsername && (
            <a
              href={`https://github.com/${member.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
          )}
          {member.twitterHandle && (
            <a
              href={`https://x.com/${member.twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              title="X (Twitter)"
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
          )}
          {member.linkedinUrl && (
            <a
              href={member.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
