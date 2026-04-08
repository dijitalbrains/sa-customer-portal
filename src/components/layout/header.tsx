"use client";

import { BellIcon, CartIcon, MenuIcon } from "@/components/icons";

interface HeaderProps {
  userName: string;
  onMenuClick: () => void;
}

export default function Header({ userName, onMenuClick }: HeaderProps) {
  const legacyPortalUrl = process.env.LEGACY_PORTAL_URL || "http://sa-portal.test";

  return (
    <header className="h-[70px] bg-surface-base shadow-[14px_0px_34px_0px_#00000014] rounded-l-[20px] flex items-center justify-between px-5 md:px-6 shrink-0 z-30 md:ml-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center text-text-muted"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <p className="text-[15px] text-text-heading">
          Hi <span className="font-bold text-brand-primary">{userName}</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={legacyPortalUrl}
          className="inline-flex items-center px-3 py-1.5 rounded-pill bg-brand-primary text-white text-[12px] font-semibold hover:bg-brand-deep transition-colors"
        >
          Legacy Portal &rarr;
        </a>
        <button className="w-9 h-9 rounded-full bg-surface-overlay flex items-center justify-center text-text-muted hover:bg-border-subtle/30 transition-colors">
          <CartIcon className="w-[18px] h-[18px]" />
        </button>
        <button className="relative w-9 h-9 rounded-full bg-surface-overlay flex items-center justify-center text-text-muted hover:bg-border-subtle/30 transition-colors">
          <BellIcon className="w-[18px] h-[18px]" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-primary rounded-full border-2 border-surface-base" />
        </button>
      </div>
    </header>
  );
}
