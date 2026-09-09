import { createContext, useContext, useState } from "react";

type Language = "en" | "zh";
const dictionary = {
  en: { dashboard: "Overview", intake: "Warehouse intake", consolidation: "Consolidation", voyages: "Voyages", staff: "Staff accounts", signOut: "Sign out", tracking: "Track cargo" },
  zh: { dashboard: "概览", intake: "仓库入库", consolidation: "拼箱管理", voyages: "航次管理", staff: "员工账号", signOut: "退出登录", tracking: "货物追踪" },
};

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: typeof dictionary.en }>({ language: "en", setLanguage: () => undefined, t: dictionary.en });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("speed-language") as Language) || "en");
  const change = (next: Language) => { localStorage.setItem("speed-language", next); setLanguage(next); };
  return <LanguageContext.Provider value={{ language, setLanguage: change, t: dictionary[language] }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
