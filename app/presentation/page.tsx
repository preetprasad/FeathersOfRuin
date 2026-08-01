import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "../../lib/admin-auth";
import { PresentationMode } from "./presentation-mode";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Interactive presentation",
  description: "A guided, interactive explanation of Reid Sentinel's data analysis and decision-support method.",
  robots: { index: false, follow: false },
};

export default async function PresentationPage() {
  const cookieStore = await cookies();
  const authenticated = await verifyAdminSession(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value,
    process.env.ADMIN_SESSION_SECRET,
  );
  if (!authenticated) redirect("/admin?returnTo=%2Fpresentation");
  return <PresentationMode />;
}
