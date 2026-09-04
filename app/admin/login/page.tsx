import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminLoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <main className="login-wrap">
      <section className="login-card">
        <span className="brand-mark">P</span>
        <h1>Owner access</h1>
        <p>Sign in to manage appointments, weekly hours, and blocked dates.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
