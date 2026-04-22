import type { UserAccount } from "@/lib/types/user";

interface HeaderProps {
  user: UserAccount;
}

export default function Header({ user }: HeaderProps) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl min-h-[130px] px-8 py-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/images/bg/account-header.png')" }}
    >
      <div className="relative flex items-center gap-6 min-w-0">
        <div className="relative shrink-0">
          <div className="absolute inset-[-10px] rounded-full bg-white/10" />
          <div className="relative w-20 h-20 rounded-full bg-avatar-gradient flex items-center justify-center">
            <span className="text-[26px] font-bold text-white">{user.initials || "?"}</span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[22px] font-bold text-white truncate">{user.fullName}</span>
          <div className="flex flex-col">
            <span className="text-[13px] font-normal text-white/80 truncate">{user.email}</span>
            <span className="text-[13px] font-normal text-white/70">{user.phone}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
