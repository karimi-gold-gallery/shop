import { redirectIfAuthenticated } from "@/lib/auth";

export default async function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfAuthenticated();
  return children;
}
