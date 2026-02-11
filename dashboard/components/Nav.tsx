import Link from "next/link";

export default function Nav() {
  return (
    <nav className="border-b border-[#0f3460] bg-[#16213e]">
      <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
        <Link href="/" className="text-lg font-bold text-white">
          Chain Bias Dashboard
        </Link>
      </div>
    </nav>
  );
}
