import { redirectIfAuthenticated } from "@/lib/auth";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfAuthenticated();
  return children;
}
