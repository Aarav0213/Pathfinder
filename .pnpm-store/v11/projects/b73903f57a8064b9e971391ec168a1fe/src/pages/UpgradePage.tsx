import { useNavigate } from "react-router-dom";
import { isProUser, upgradeToPro } from "../services/billingService";

const plans = [
  {
    name: "Free",
    price: "$0",
    features: ["Up to 3 job posts", "Basic access", "Standard applications"],
  },
  {
    name: "Pro",
    price: "$29",
    features: ["Unlimited job posts", "Recruiter badge", "Priority hiring workflow"],
  },
];

export default function UpgradePage() {
  const navigate = useNavigate();
  const pro = isProUser();

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Upgrade to Pro</h1>
          <p className="mt-2 text-slate-600">Mock billing scaffold for recruiter-ready SaaS monetization.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.name} className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                <div className="text-3xl font-bold">{plan.price}</div>
              </div>
              <ul className="mt-6 space-y-3 text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-brand-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className="button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
                disabled
                onClick={() => {
                  upgradeToPro();
                  navigate("/dashboard");
                }}
              >
                {plan.name === "Pro" && pro ? "Already on Pro" : "Stripe checkout coming soon"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
