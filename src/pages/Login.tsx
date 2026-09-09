import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Navigate } from "react-router-dom";
import { Boxes, CheckCircle2, Languages } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const { session } = useAuth();
  const { language, setLanguage } = useLanguage();
  if (session) return <Navigate to="/app" replace />;
  return <div className="grid min-h-screen bg-[#eef4f9] lg:grid-cols-[1.1fr_.9fr]">
    <section className="relative hidden overflow-hidden bg-[#062542] p-14 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-24 top-20 size-80 rounded-full border-[70px] border-white/5" />
      <Brand light />
      <div className="relative max-w-xl"><p className="text-sm font-black uppercase tracking-[0.2em] text-[#ed1c2a]">China to Ghana logistics</p><h1 className="mt-5 text-6xl font-black leading-[.94] tracking-tight">Every carton.<br />One clear journey.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-white/65">Receive, measure, consolidate, ship and release LCL cargo with a reliable milestone trail.</p><div className="mt-10 grid grid-cols-2 gap-4"><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><Boxes className="text-[#ed1c2a]" /><p className="mt-4 font-bold">Yiwu & Guangzhou</p><p className="mt-1 text-sm text-white/55">One connected intake workflow</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><CheckCircle2 className="text-[#ed1c2a]" /><p className="mt-4 font-bold">Milestone tracking</p><p className="mt-1 text-sm text-white/55">Clear updates for every customer</p></div></div></div>
      <p className="text-sm text-white/40">Speed Cargo Ghana · Operations Hub</p>
    </section>
    <section className="flex items-center justify-center p-5 sm:p-10">
      <div className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-2xl shadow-[#062542]/10 sm:p-10">
        <div className="flex items-center justify-between lg:justify-end"><div className="lg:hidden"><Brand /></div><Button variant="ghost" size="sm" className="gap-2" onClick={() => setLanguage(language === "en" ? "zh" : "en")}><Languages className="size-4" />{language === "en" ? "中文" : "English"}</Button></div>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#ed1c2a]">Secure team access</p>
        <h2 className="mt-2 text-3xl font-black">{language === "en" ? "Welcome back" : "欢迎回来"}</h2>
        <p className="mt-2 text-sm text-slate-500">{language === "en" ? "Use your assigned work account." : "使用分配给您的工作账号。"}</p>
        <div className="mt-7">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: { brand: "#ed1c2a", brandAccent: "#c91521", inputText: "#062542", inputBorder: "#d8e2ea" },
                  radii: { borderRadiusButton: "12px", inputBorderRadius: "12px" },
                },
              },
            }}
            theme="light"
          />
        </div>
      </div>
    </section>
  </div>;
}
