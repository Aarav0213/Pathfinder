import ContactFooter from "../components/ContactFooter";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-[calc(100vh-65px)] bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: August 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
            <p>
              Pathfinder helps users search internship listings, save jobs, track applications,
              and manage account features. This Privacy Policy explains what information we collect
              and how we use it.
            </p>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Information we collect</h2>
              <p className="mt-2">
                We may collect account information such as your email address, profile details,
                saved jobs, applications, watchlist companies, and subscription status. If you use
                paid features, payment processing is handled by Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">How we use information</h2>
              <p className="mt-2">
                We use your information to provide the app, authenticate your account, show relevant
                job information, manage saved jobs and applications, send notifications, process
                subscriptions, and improve Pathfinder.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Third-party services</h2>
              <p className="mt-2">
                Pathfinder may use third-party services such as hosting providers, job data APIs,
                email providers, analytics tools, and Stripe for payments. These services may process
                information according to their own policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Data security</h2>
              <p className="mt-2">
                We use reasonable safeguards to protect user information, but no online service can
                guarantee complete security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
              <p className="mt-2">
                If you have questions about this Privacy Policy, contact us at{" "}
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
