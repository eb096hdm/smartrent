// Profil-Seite: angemeldete Nutzer:innen können ihre Stammdaten ansehen und bearbeiten.

import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = {
  vorname: string | null;
  nachname: string | null;
};

const Profil = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile>({ vorname: "", nachname: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Auth-Listener zuerst, dann Session abrufen
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth", { replace: true });
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      if (!mounted) return;
      setEmail(session.user.email ?? "");

      const { data: p, error } = await supabase
        .from("profiles")
        .select("vorname,nachname")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) {
        toast.error("Profil konnte nicht geladen werden.");
      } else if (p && mounted) {
        setProfile({
          vorname: p.vorname ?? "",
          nachname: p.nachname ?? "",
        });
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      toast.error("Nicht angemeldet.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          vorname: profile.vorname || null,
          nachname: profile.nachname || null,
        },
        { onConflict: "user_id" },
      );

    if (error) {
      toast.error("Speichern fehlgeschlagen.");
    } else {
      toast.success("Profil aktualisiert.");
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-ink text-ink-foreground">
      <div className="flex items-center justify-between px-6 sm:px-10 pt-8">
        <Link to="/" className="text-2xl font-semibold tracking-tight">SmartRent</Link>
        <Button variant="outline" onClick={handleSignOut} className="bg-transparent border-white/20 text-white hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Abmelden
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="display text-4xl text-white">Mein Profil</h1>
        <p className="mt-2 text-sm text-white/70">Verwalte deine persönlichen Daten.</p>

        {loading ? (
          <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/70" /></div>
        ) : (
          <form onSubmit={handleSave} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-black/50 p-6 sm:p-8">
            <div>
              <Label className="text-white/80">E-Mail</Label>
              <Input value={email} disabled className="bg-white/5 border-white/10 text-white/70" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vorname" className="text-white/80">Vorname</Label>
                <Input id="vorname" value={profile.vorname ?? ""} onChange={(e) => setProfile((p) => ({ ...p, vorname: e.target.value }))} className="bg-white/10 border-white/15 text-white" />
              </div>
              <div>
                <Label htmlFor="nachname" className="text-white/80">Nachname</Label>
                <Input id="nachname" value={profile.nachname ?? ""} onChange={(e) => setProfile((p) => ({ ...p, nachname: e.target.value }))} className="bg-white/10 border-white/15 text-white" />
              </div>
            </div>
            <div>
              <Label htmlFor="telefon" className="text-white/80">Telefon</Label>
              <Input id="telefon" value={profile.telefon ?? ""} onChange={(e) => setProfile((p) => ({ ...p, telefon: e.target.value }))} placeholder="+491701234567" className="bg-white/10 border-white/15 text-white" />
            </div>
            <div>
              <Label htmlFor="geburtsdatum" className="text-white/80">Geburtsdatum</Label>
              <Input id="geburtsdatum" type="date" value={profile.geburtsdatum ?? ""} onChange={(e) => setProfile((p) => ({ ...p, geburtsdatum: e.target.value }))} className="bg-white/10 border-white/15 text-white" />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Änderungen speichern"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
};

export default Profil;
