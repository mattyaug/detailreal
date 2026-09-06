import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminLoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <main className="login-wrap">
      <section className="login-card">
        <img className="brand-logo" src="/nueces-detail-logo.png" alt="Nueces Detail" width={72} height={72} />
        <h1>Owner access</h1>
        <p>Sign in to manage appointments, weekly hours, and blocked dates.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
