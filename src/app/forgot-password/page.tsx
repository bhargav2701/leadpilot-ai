import Link from "next/link";
import { forgotPassword } from "../auth/actions";
import { AuthForm } from "../auth/auth-form";

export default function ForgotPasswordPage() {
  return (
    <AuthForm
      action={forgotPassword}
      buttonLabel="Send reset link"
      description="Enter your email and we will send password reset instructions."
      footer={
        <>
          Remember your password?{" "}
          <Link className="font-semibold text-orange-400 hover:text-orange-300" href="/login">
            Login
          </Link>
        </>
      }
      mode="forgot"
      title="Reset password"
    />
  );
}
