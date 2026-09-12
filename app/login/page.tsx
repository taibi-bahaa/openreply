import { EMAIL_PROVIDER_ID, signIn } from "@/lib/auth";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Login - OpenReply",
  description: "Sign in to manage Instagram comment-to-DM campaigns.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkEmail?: string;
    callbackUrl?: string;
    template?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const checkEmail = params.checkEmail === "1";
  const hasError = Boolean(params.error);
  const selectedTemplate = getCampaignTemplate(params.template);
  const templateCallbackUrl = selectedTemplate
    ? `/campaigns/new?template=${selectedTemplate.slug}`
    : null;
  const callbackUrl = params.callbackUrl ?? templateCallbackUrl ?? "/dashboard";

  async function loginWithCredentials(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: callbackUrl,
      });
    } catch (error) {
      if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
        throw error;
      }
      redirect(`/login?error=InvalidCredentials&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }

  async function sendMagicLink(formData: FormData) {
    "use server";
    await signIn(EMAIL_PROVIDER_ID, {
      email: String(formData.get("email") ?? "").trim(),
      redirectTo: callbackUrl,
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            OpenReply
          </h1>
          <p className="text-muted text-sm leading-relaxed mt-2">
            {selectedTemplate
              ? `Sign in to use the ${selectedTemplate.title} template.`
              : "Sign in with your credentials to access your dashboard."}
          </p>
        </div>

        <div className="panel rounded p-8 shadow-black/40">
          {hasError && (
            <div className="mb-5 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              Invalid email or password. Please try again.
            </div>
          )}

          {selectedTemplate && !checkEmail && (
            <div className="mb-5 border border-accent/20 bg-accent/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Template selected
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {selectedTemplate.title}
              </p>
            </div>
          )}

          {checkEmail ? (
            <div className="text-center py-4">
              <h2 className="text-lg font-semibold mb-2">Check your email</h2>
              <p className="text-sm text-muted">
                We sent you a secure sign-in link. Open it on this device to
                continue.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <form action={loginWithCredentials} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    defaultValue="taibi.bahaa@gmail.com"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="w-full px-4 py-2.5 rounded bg-surface border border-border text-sm text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 rounded bg-surface border border-border text-sm text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded bg-accent px-6 py-3 text-sm font-semibold text-white shadow-indigo-500/25 transition-all hover:bg-accent/90 cursor-pointer"
                >
                  Sign In
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-xs text-muted">or send magic link</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <form action={sendMagicLink} className="space-y-3">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Enter email for magic link"
                  className="w-full px-4 py-2 rounded bg-surface border border-border text-xs text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded border border-border bg-surface px-4 py-2 text-xs font-medium text-muted hover:text-foreground hover:bg-surface/80 transition-all cursor-pointer"
                >
                  Email me a link
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
