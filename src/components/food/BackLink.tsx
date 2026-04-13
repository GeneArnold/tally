import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  href: string;
  label: string;
}

export default function BackLink({ href, label }: Props) {
  return (
    <Link href={href} className="flex items-center gap-1 text-blue-600 font-medium mb-4 min-h-[44px]">
      <ArrowLeft size={20} /> {label}
    </Link>
  );
}
