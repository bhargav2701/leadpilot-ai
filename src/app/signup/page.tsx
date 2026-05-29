import Link from "next/link";
import { signUp } from "../auth/actions";
import { AuthForm } from "../auth/auth-form";

export default function SignupPage() {
  return (
    <AuthForm
      action={signUp}
      buttonLabel="Create account"
      description="Start recovering missed leads with AI-powered follow-up."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-orange-400 hover:text-orange-300" href="/login">
            Login
          </Link>
        </>
      }
      mode="signup"
      title="Create your account"
    />
  );
}
