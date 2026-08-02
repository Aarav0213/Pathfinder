import ContactFooter from "../components/ContactFooter";

export default function TermsPage() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: August 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
            <p>
              These Terms of Service govern your use of Pathfinder. By using Pathfinder, you agree
              to these terms.
            </p>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Use of Pathfinder</h2>
              <p className="mt-2">
                Pathfinder provides internship search, saved jobs, application tracking, watchlists,
                and related career tools. You agree to use the service lawfully and not misuse,
                disrupt, or attempt to access systems without permission.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Accounts</h2>
              <p className="mt-2">
                You are responsible for your account activity and for keeping your login information
                secure. We may suspend access if we detect misuse or activity that harms the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Job listings</h2>
              <p className="mt-2">
                Pathfinder may display job listings from third-party sources. We do not guarantee
                that every listing is accurate, available, or suitable for every user. Always review
                employer information before applying.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Payments and subscriptions</h2>
              <p className="mt-2">
                Paid features may be billed through Stripe. Subscription pricing, renewal, and
                cancellation details are shown during checkout or in the billing portal.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">No guarantee of employment</h2>
              <p className="mt-2">
                Pathfinder helps users discover and track opportunities, but we do not guarantee
                interviews, offers, employment, or application outcomes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
              <p className="mt-2">
                If you have questions about these Terms, contact us at{" "}
                <a className="font-medium text-brand-600 hover:text-brand-700" href="mailto:coolaarav1008@gmail.com">
                  coolaarav1008@gmail.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </section>
      <ContactFooter />
    </main>
  );
}
