import { Mail } from "lucide-react";
import { site } from "@/lib/config";

function InstagramIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 3h-2.7v12.4a2.3 2.3 0 1 1-2.3-2.3c.24 0 .47.04.69.1v-2.8a5.1 5.1 0 1 0 4.31 5.04V8.9a6.3 6.3 0 0 0 3.7 1.19V7.3a3.6 3.6 0 0 1-3-2.06A3.6 3.6 0 0 1 16.5 3Z" />
    </svg>
  );
}

export default function SocialLinks({ className = "", size = 14 }) {
  const { socials } = site;
  const items = [
    socials.instagram && { href: socials.instagram, label: "Instagram", Icon: InstagramIcon },
    socials.tiktok && { href: socials.tiktok, label: "TikTok", Icon: TikTokIcon },
    socials.email && { href: socials.email, label: "Email", Icon: Mail },
  ].filter(Boolean);

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          aria-label={label}
          className="group flex items-center justify-center rounded-full border-2 border-petal bg-white/70 text-grape shadow-soft transition-all hover:scale-110 hover:border-rose hover:text-rose"
          style={{ height: `${size * 4}px`, width: `${size * 4}px` }}
        >
          <Icon className="h-1/2 w-1/2" />
        </a>
      ))}
    </div>
  );
}
