import { requireIncompleteOnboarding } from "@/lib/auth";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireIncompleteOnboarding();
  return children;
}
