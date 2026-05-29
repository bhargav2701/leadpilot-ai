import Link from "next/link";
import { logIn } from "../auth/actions";
import { AuthForm } from "../auth/auth-form";

export default function LoginPage() {
  return (
    <AuthForm
      action={logIn}
      buttonLabel="Login"
      description="Access your LeadPilot AI dashboard."
      footer={
        <div className="space-y-3">
          <p>
            New here?{" "}
            <Link className="font-semibold text-orange-400 hover:text-orange-300" href="/signup">
              Create an account
            </Link>
          </p>
          <p>
            <Link
              className="font-semibold text-orange-400 hover:text-orange-300"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </p>
        </div>
      }
      mode="login"
      title="Welcome back"
    />
  );
}
