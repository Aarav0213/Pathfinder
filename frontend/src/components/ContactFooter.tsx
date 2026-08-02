export default function ContactFooter() {
  return (
    <footer className="bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-4 py-6 text-sm sm:px-6 lg:px-8">
        <a
          href="mailto:coolaarav1008@gmail.com"
          className="font-medium text-slate-500 transition hover:text-brand-600"
        >
          Contact us
        </a>
        <span className="text-slate-300">•</span>
        <a
          href="/privacy"
          className="font-medium text-slate-500 transition hover:text-brand-600"
        >
          Privacy Policy
        </a>
        <span className="text-slate-300">•</span>
        <a
          href="/terms"
          className="font-medium text-slate-500 transition hover:text-brand-600"
        >
          Terms of Service
        </a>
      </div>
    </footer>
  );
}
