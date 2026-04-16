"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Filter Renewals", icon: "/assets/icons/nav-filter.svg" },
  { href: "/orders", label: "Orders", icon: "/assets/icons/nav-orders.svg" },
  { href: "/my-account", label: "My Account", icon: "/assets/icons/user.svg" },
  { href: "/renewal-timeline", label: "Renewal Timeline", icon: "/assets/icons/timeline.svg" },
  { href: "/support", label: "Support", icon: "/assets/icons/support.svg" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile overlay — click outside to close */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        data-print-hide=""
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[268px] bg-surface-base flex flex-col h-full shrink-0
          shadow-[14px_0px_34px_0px_#00000014] rounded-[20px]
          transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0 rounded-l-none" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="px-5 py-[45px] flex items-center justify-center">
          <Link href="/">
            <Image
              src="/assets/images/logo.png"
              alt="Spring Aqua"
              width={204}
              height={61}
              priority
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 flex flex-col gap-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 h-10 px-4 rounded-lg text-[14px] transition-colors w-full ${
                  active
                    ? "bg-brand-gradient text-white font-medium"
                    : "text-black font-normal hover:bg-surface-overlay"
                }`}
              >
                <img
                  src={item.icon}
                  alt=""
                  className={`w-4 h-4 shrink-0 ${active ? "brightness-0 invert" : ""}`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Credits */}
        <div className="px-4 py-6">
          <div className="bg-surface-overlay rounded-lg px-4 py-4 flex items-center justify-between">
            <span className="text-black text-[14px]">Credits:</span>
            <span className="text-brand-primary font-bold text-[15px]">$1500</span>
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 pb-5">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-3 h-10 px-4 rounded-lg text-[14px] font-normal text-black hover:bg-surface-overlay transition-colors w-full"
          >
            <img src="/assets/icons/logout.svg" alt="" className="w-4 h-4" />
            Logout
          </a>
        </div>
      </aside>
    </>
  );
}
