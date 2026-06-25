import Link from "next/link";
import { Flower2 } from "lucide-react";

export const metadata = { title: "Checkout cancelled" };

export default function CancelPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
      <Flower2 className="h-16 w-16 text-rose" strokeWidth={1.25} />
      <h1 className="section-title mt-6">No worries!</h1>
      <p className="mt-4 text-plum/75">
        Your checkout was cancelled and you haven&apos;t been charged. Your
        commission is still waiting whenever you&apos;re ready. Have a question
        first? I&apos;d love to help!
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/contact" className="btn-secondary">
          Ask a question
        </Link>
        <Link href="/commissions" className="btn-primary">
          Back to my order
        </Link>
      </div>
    </div>
  );
}
