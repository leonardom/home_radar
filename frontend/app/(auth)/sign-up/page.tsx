import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUp routing="path" path="/(auth)/sign-up" />
    </main>
  );
}
