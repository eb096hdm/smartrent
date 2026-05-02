// Registrierungs-Modal mit Echtzeit-Validierung (Zod + react-hook-form),
// Volljährigkeits-Check, Telefon-Format-Validierung, Honeypot-Feld und
// Datenschutz-Pflichtzustimmung. Nach erfolgreicher Übermittlung wird der
// Status lokal gemerkt und auf /preise weitergeleitet.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { markRegistered } from "@/lib/registration";

// --- Validierungs-Schema ---
const phoneRegex = /^\+?[1-9]\d{7,14}$/;

const isAdult = (d: Date) => {
  const now = new Date();
  const eighteen = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  return d <= eighteen;
};

const schema = z.object({
  vorname: z.string().trim().min(2, "Mindestens 2 Zeichen").max(100),
  nachname: z.string().trim().min(2, "Mindestens 2 Zeichen").max(100),
  geburtsdatum: z
    .date({ required_error: "Bitte Geburtsdatum wählen" })
    .refine(isAdult, "Die Nutzung ist erst ab 18 Jahren möglich."),
  email: z.string().trim().email("Ungültige E-Mail-Adresse").max(255),
  telefon: z
    .string()
    .trim()
    .refine((v) => phoneRegex.test(v.replace(/\s|-/g, "")), "Ungültiges Format (z. B. +491701234567)"),
  datenschutz: z.literal(true, {
    errorMap: () => ({ message: "Bitte Datenschutz akzeptieren" }),
  }),
  // Honeypot — muss leer bleiben
  website: z.string().max(0, "").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegistrationModal = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      vorname: "",
      nachname: "",
      email: "",
      telefon: "",
      datenschutz: undefined as unknown as true,
      website: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("register-user", {
        body: {
          vorname: values.vorname,
          nachname: values.nachname,
          geburtsdatum: format(values.geburtsdatum, "yyyy-MM-dd"),
          email: values.email,
          telefon: values.telefon.replace(/\s|-/g, ""),
          datenschutz_akzeptiert: true,
          website: values.website ?? "",
        },
      });

      if (error || !data?.ok) {
        const fieldErrors = (data as any)?.errors as Record<string, string> | undefined;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([k, v]) =>
            form.setError(k as keyof FormValues, { message: v }),
          );
        } else {
          toast.error("Registrierung fehlgeschlagen. Bitte versuche es erneut.");
        }
        return;
      }

      markRegistered(values.email);
      toast.success("Registrierung erfolgreich!");
      onOpenChange(false);
      navigate("/preise");
    } catch (e) {
      console.error(e);
      toast.error("Etwas ist schiefgelaufen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Jetzt registrieren</DialogTitle>
          <DialogDescription>
            Schließe die kurze Registrierung ab, um die interaktive Karte zur Preisempfehlung zu öffnen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Honeypot — für Menschen unsichtbar */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            {...form.register("website")}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vorname">Vorname</Label>
              <Input id="vorname" {...form.register("vorname")} />
              {form.formState.errors.vorname && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.vorname.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="nachname">Nachname</Label>
              <Input id="nachname" {...form.register("nachname")} />
              {form.formState.errors.nachname && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.nachname.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Geburtsdatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("geburtsdatum") && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("geburtsdatum")
                    ? format(form.watch("geburtsdatum"), "dd.MM.yyyy")
                    : "Datum wählen"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("geburtsdatum")}
                  onSelect={(d) => d && form.setValue("geburtsdatum", d, { shouldValidate: true })}
                  captionLayout="dropdown-buttons"
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                  disabled={(date) => date > new Date() || date < new Date("1920-01-01")}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.geburtsdatum && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.geburtsdatum.message as string}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="telefon">Telefonnummer</Label>
            <Input id="telefon" placeholder="+491701234567" {...form.register("telefon")} />
            {form.formState.errors.telefon && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.telefon.message}</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="datenschutz"
              checked={!!form.watch("datenschutz")}
              onCheckedChange={(c) =>
                form.setValue("datenschutz", c === true ? true : (false as unknown as true), {
                  shouldValidate: true,
                })
              }
            />
            <Label htmlFor="datenschutz" className="text-xs leading-snug cursor-pointer">
              Ich akzeptiere die{" "}
              <a href="/datenschutz" target="_blank" className="underline">
                Datenschutzerklärung
              </a>{" "}
              und stimme der Verarbeitung meiner Daten zu.
            </Label>
          </div>
          {form.formState.errors.datenschutz && (
            <p className="text-xs text-destructive">{form.formState.errors.datenschutz.message as string}</p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Wird gesendet…
              </>
            ) : (
              "Registrieren & Karte öffnen"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
