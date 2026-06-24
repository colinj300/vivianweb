import Link from "next/link";

export const metadata = { title: "Order received ♡" };

export default function SuccessPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
      <div className="text-6xl animate-wiggle">🎉</div>
      <h1 className="section-title mt-6">Yay! Your order is in ♡</h1>
      <p className="mt-4 text-plum/75">
        Thank you so much for your commission! A confirmation has been sent to
        your email. I&apos;ll review your details and reach out about your
        artwork soon. I can&apos;t wait to make something special for you!
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/gallery" className="btn-secondary">
          Browse the gallery
        </Link>
        <Link href="/" className="btn-primary">
          Back home
        </Link>
      </div>
    </div>
  );
}
