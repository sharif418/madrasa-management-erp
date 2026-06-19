// Landing page — SaaS marketing site for the Madrasa Manager ERP
// Sections: Hero, Stats, Features, Finance highlight, Pricing, Footer
"use client";
import { useApp } from "@/store/app-store";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen, Wallet, Users, GraduationCap, Globe, Shield, Star,
  CheckCircle2, Moon, TrendingUp, Bell, ArrowRight, Sparkles, Heart,
} from "lucide-react";
import { LoginDialog } from "@/components/auth/login-dialog";
import { SignupDialog } from "@/components/auth/signup-dialog";
import { useState } from "react";

export function LandingPage() {
  const { t } = useApp();
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const features = [
    { icon: Wallet, key: "finance", color: "from-emerald-500 to-teal-600" },
    { icon: BookOpen, key: "hifz", color: "from-amber-500 to-orange-600" },
    { icon: Users, key: "multi", color: "from-rose-500 to-pink-600" },
    { icon: Globe, key: "i18n", color: "from-violet-500 to-purple-600" },
    { icon: Bell, key: "attendance", color: "from-cyan-500 to-blue-600" },
    { icon: GraduationCap, key: "academic", color: "from-teal-500 to-green-600" },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "৳999",
      desc: "Perfect for small madrasas under 100 students",
      features: ["Up to 100 students", "All core modules", "Bangla + English", "Email support", "5GB storage"],
      popular: false,
    },
    {
      name: "Professional",
      price: "৳2,499",
      desc: "For growing madrasas with advanced needs",
      features: ["Up to 500 students", "All modules + Hifz engine", "Bangla + English + Arabic", "Priority support", "25GB storage", "Audit logs", "Multi-branch support"],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "৳5,999",
      desc: "For large institutions and networks",
      features: ["Unlimited students", "All features unlocked", "All languages", "24/7 phone support", "100GB storage", "Custom integrations", "Dedicated manager", "SLA guarantee"],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-emerald-950/20 dark:via-background dark:to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Moon className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">{t("common.appName")}</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">{t("common.tagline")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)} className="hidden sm:inline-flex">
              {t("landing.hero.login")}
            </Button>
            <Button size="sm" onClick={() => setSignupOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              {t("landing.hero.cta")}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute top-20 right-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5 py-1.5 px-3 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              {t("landing.hero.badge")}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent pb-2">
              {t("landing.hero.title")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("landing.hero.subtitle")}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => setSignupOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-base px-8 h-12 gap-2">
                {t("landing.hero.cta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLoginOpen(true)} className="text-base px-8 h-12">
                {t("landing.hero.login")}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { value: "150+", label: t("landing.stats.madrasas"), icon: Moon },
              { value: "25K+", label: t("landing.stats.students"), icon: Users },
              { value: "99.9%", label: t("landing.stats.uptime"), icon: TrendingUp },
              { value: "3", label: t("landing.stats.languages"), icon: Globe },
            ].map((s, i) => (
              <Card key={i} className="text-center py-6 border-0 shadow-md bg-gradient-to-br from-white to-emerald-50/30 dark:from-card dark:to-emerald-950/20">
                <s.icon className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <div className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-teal-700 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-b from-transparent via-emerald-50/30 to-transparent dark:via-emerald-950/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">{t("landing.features.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("landing.features.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((f) => (
              <Card key={f.key} className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t(`landing.${f.key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`landing.${f.key}.desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">{t("landing.pricing.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("landing.pricing.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((p) => (
              <Card
                key={p.name}
                className={`relative overflow-hidden ${
                  p.popular
                    ? "border-2 border-emerald-500 shadow-xl scale-[1.02]"
                    : "border shadow-md hover:shadow-lg transition-shadow"
                }`}
              >
                {p.popular && (
                  <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center text-xs py-1.5 font-medium">
                    {t("landing.pricing.popular")}
                  </div>
                )}
                <CardContent className={`p-6 ${p.popular ? "pt-10" : ""}`}>
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4 min-h-[40px]">{p.desc}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{t("landing.pricing.monthly")}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${p.popular ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" : ""}`}
                    variant={p.popular ? "default" : "outline"}
                    onClick={() => setSignupOpen(true)}
                  >
                    {t("landing.pricing.cta")}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-3">{t("landing.pricing.trial")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
            <CardContent className="p-10 lg:p-14 text-center relative">
              <div className="absolute inset-0 opacity-10">
                <Moon className="absolute top-4 right-4 h-32 w-32" />
                <Star className="absolute bottom-4 left-8 h-16 w-16" />
                <Star className="absolute top-1/2 left-1/3 h-12 w-12" />
              </div>
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Bismillah — Start Your Journey</h2>
              <p className="text-emerald-50 max-w-xl mx-auto mb-8">
                Join hundreds of madrasas across Bangladesh already managing their institutions with Madrasa Manager. Free 14-day trial — no credit card required.
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setSignupOpen(true)}
                className="bg-white text-emerald-700 hover:bg-emerald-50 text-base px-8 h-12 gap-2"
              >
                {t("landing.hero.cta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-gradient-to-b from-transparent to-emerald-50/50 dark:to-emerald-950/20">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Moon className="h-4 w-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">{t("common.appName")}</span>
                <span className="text-[10px] text-muted-foreground">© {new Date().getFullYear()} — {t("landing.footer.rights")}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {t("landing.footer.made")} <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
            </p>
          </div>
        </div>
      </footer>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} />
    </div>
  );
}
