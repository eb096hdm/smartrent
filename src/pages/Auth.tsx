// Auth-Seite: Anmeldung & Registrierung per E-Mail/Passwort sowie Google.
// Bei Erfolg → Weiterleitung zum Profil.

import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Bereits eingeloggt? Direkt weiterleiten.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/profil", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/profil", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profil`,
            data: { vorname, nachname },
          },
        });
        if (error) throw error;
        toast.success("Registrierung erfolgreich! Bitte E-Mail bestätigen.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Willkommen zurück!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Etwas ist schiefgelaufen.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/profil`,
    });
    if (result.error) {
      toast.error("Google-Anmeldung fehlgeschlagen.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink text-ink-foreground flex flex-col">
      <div className="flex items-center justify-between px-6 sm:px-10 pt-8">
        <Link to="/" className="text-2xl font-semibold tracking-tight">SmartRent</Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/50 p-8 shadow-2xl">
          <h1 className="display text-3xl text-white">
            {mode === "signin" ? "Willkommen zurück" : "Konto erstellen"}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {mode === "signin"
              ? "Melde dich an, um auf dein Profil zuzugreifen."
              : "Registriere dich kostenlos, um SmartRent zu nutzen."}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full bg-white text-ink hover:bg-white/90"
            onClick={handleGoogle}
            disabled={loading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Mit Google fortfahren
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-white/50">
            <div className="h-px flex-1 bg-white/15" />
            oder
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="vorname" className="text-white/80">Vorname</Label>
                  <Input id="vorname" value={vorname} onChange={(e) => setVorname(e.target.value)} required className="bg-white/10 border-white/15 text-white" />
                </div>
                <div>
                  <Label htmlFor="nachname" className="text-white/80">Nachname</Label>
                  <Input id="nachname" value={nachname} onChange={(e) => setNachname(e.target.value)} required className="bg-white/10 border-white/15 text-white" />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-white/80">E-Mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/10 border-white/15 text-white" />
            </div>
            <div>
              <Label htmlFor="password" className="text-white/80">Passwort</Label>
              <Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-white/10 border-white/15 text-white" />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Anmelden" : "Registrieren"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/70">
            {mode === "signin" ? "Noch kein Konto? " : "Bereits registriert? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-white underline underline-offset-4 hover:opacity-80"
            >
              {mode === "signin" ? "Jetzt registrieren" : "Anmelden"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Auth;
