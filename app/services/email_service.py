import os
import resend

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = "notifications@Pathfinder.app"

resend.api_key = RESEND_API_KEY

def send_email(to: str, subject: str, html: str) -> bool:
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to,
            "subject": subject,
            "html": html,
        })
        return True
    except Exception as e:
        print("Email send failed: " + str(e))
        return False

def send_watchlist_alert(to: str, company: str, jobs: list) -> bool:
    job_rows = ""
    for title in jobs[:5]:
        job_rows += "<tr><td style='padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;'>" + title + "</td></tr>"

    html = """
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:#1e293b;padding:32px;border-radius:12px 12px 0 0;">
        <div style="font-size:24px;font-weight:700;color:#ffffff;">Pathfinder</div>
        <div style="font-size:13px;color:#94a3b8;margin-top:4px;">Your internship discovery platform</div>
      </div>
      <div style="padding:32px;">
        <h2 style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 8px;">New internships at """ + company + """</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px;">We found """ + str(len(jobs)) + """ new role(s) matching your watchlist.</p>
        <table style="width:100%;border-collapse:collapse;">
          """ + job_rows + """
        </table>
        <div style="margin-top:24px;">
          <a href="http://localhost:5173/jobs?company=""" + company + """" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">View all listings</a>
        </div>
      </div>
      <div style="padding:24px 32px;background:#f8fafc;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;">
        You are receiving this because you added """ + company + """ to your watchlist. <a href="http://localhost:5173/watchlist" style="color:#4f46e5;">Manage watchlist</a>
      </div>
    </div>
    """
    return send_email(to, "New internships at " + company + " on Pathfinder", html)

def send_welcome_email(to: str) -> bool:
    html = """
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:#1e293b;padding:32px;border-radius:12px 12px 0 0;">
        <div style="font-size:24px;font-weight:700;color:#ffffff;">Pathfinder</div>
        <div style="font-size:13px;color:#94a3b8;margin-top:4px;">Your internship discovery platform</div>
      </div>
      <div style="padding:32px;">
        <h2 style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 8px;">Welcome to Pathfinder</h2>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 16px;">You now have access to hundreds of real internship listings from top companies including Stripe, Airbnb, Palantir, SpaceX, and more.</p>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">Here is what you can do:</p>
        <ul style="color:#64748b;font-size:14px;line-height:2;padding-left:20px;margin:0 0 24px;">
          <li>Search and filter thousands of internship listings</li>
          <li>Save jobs you are interested in</li>
          <li>Add companies to your watchlist for automatic alerts</li>
          <li>Track all your applications in one place</li>
          <li>Upgrade to Pro for AI cover letters and resume tailoring</li>
        </ul>
        <a href="http://localhost:5173/jobs" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Browse internships</a>
      </div>
      <div style="padding:24px 32px;background:#f8fafc;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;">
        Pathfinder &mdash; Find your next role
      </div>
    </div>
    """
    return send_email(to, "Welcome to Pathfinder", html)

def send_application_status_email(to: str, job_title: str, company: str, status: str) -> bool:
    status_colors = {
        "reviewing": "#f59e0b",
        "interview": "#3b82f6",
        "offer": "#10b981",
        "rejected": "#ef4444",
    }
    status_messages = {
        "reviewing": "Your application is being reviewed by the hiring team.",
        "interview": "Congratulations! You have been selected for an interview.",
        "offer": "Amazing news! You have received an offer.",
        "rejected": "Thank you for applying. Unfortunately you were not selected for this role.",
    }
    color = status_colors.get(status, "#64748b")
    message = status_messages.get(status, "Your application status has been updated.")

    html = """
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:#1e293b;padding:32px;border-radius:12px 12px 0 0;">
        <div style="font-size:24px;font-weight:700;color:#ffffff;">Pathfinder</div>
        <div style="font-size:13px;color:#94a3b8;margin-top:4px;">Application update</div>
      </div>
      <div style="padding:32px;">
        <h2 style="font-size:20px;font-weight:600;color:#0f172a;margin:0 0 8px;">Application update for """ + job_title + """</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px;">""" + company + """</p>
        <div style="display:inline-block;background:""" + color + """20;color:""" + color + """;padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">""" + status + """</div>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">""" + message + """</p>
        <a href="http://localhost:5173/applications" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">View your applications</a>
      </div>
      <div style="padding:24px 32px;background:#f8fafc;border-radius:0 0 12px 12px;font-size:12px;color:#94a3b8;">
        Pathfinder &mdash; Find your next role
      </div>
    </div>
    """
    return send_email(to, "Application update: " + status.title() + " for " + job_title, html)
