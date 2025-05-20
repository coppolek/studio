
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

const settingsFormSchema = z.object({
  telegramToken: z.string().min(20, "Il token sembra troppo corto.").max(100, "Il token sembra troppo lungo.").optional().or(z.literal('')),
  darkMode: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export default function SettingsPage() {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to true or based on system preference

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      telegramToken: "", // Initialize with empty string
      darkMode: true, // Initialize with a default
      notificationsEnabled: true,
    },
  });

  useEffect(() => {
    const savedToken = localStorage.getItem("telegramBotToken_TelePilot");
    if (savedToken) {
      setCurrentToken(savedToken);
      form.setValue("telegramToken", savedToken);
      setConnectionStatus("connected");
    }

    const darkModePreference = localStorage.getItem("darkMode_TelePilot");
    let initialDarkMode = true; // Default to true (dark mode)
    if (typeof window !== 'undefined') { // Ensure window is defined for matchMedia
        initialDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (darkModePreference !== null) {
      initialDarkMode = darkModePreference === 'true';
    }
    
    setIsDarkMode(initialDarkMode);
    form.setValue("darkMode", initialDarkMode);
    document.documentElement.classList.toggle("dark", initialDarkMode);

  }, [form]);


  async function onSubmit(data: SettingsFormValues) {
    let tokenStatusChanged = false;
    if (data.telegramToken && data.telegramToken !== currentToken) {
      setConnectionStatus("connecting");
      tokenStatusChanged = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (data.telegramToken) { // Check again due to optional nature
        localStorage.setItem("telegramBotToken_TelePilot", data.telegramToken);
        setCurrentToken(data.telegramToken);
      }
      setConnectionStatus("connected");
      toast({
        title: "Token Telegram Salvato!",
        description: "Il token è stato salvato localmente. Assicurati sia configurato anche lato server.",
      });
    } else if ((data.telegramToken === "" || data.telegramToken === undefined) && currentToken) { // More robust check for empty/undefined
      tokenStatusChanged = true;
      localStorage.removeItem("telegramBotToken_TelePilot");
      setCurrentToken(null);
      setConnectionStatus("disconnected");
      // Reset the specific field, keep others from data if needed or reset all
      form.reset({
        telegramToken: "",
        darkMode: data.darkMode,
        notificationsEnabled: data.notificationsEnabled
      });
      toast({
        title: "Token Telegram Rimosso",
        description: "Il token bot è stato rimosso dalla memoria locale.",
      });
    }

    if (data.darkMode !== undefined && data.darkMode !== isDarkMode) {
        setIsDarkMode(data.darkMode);
        document.documentElement.classList.toggle("dark", data.darkMode);
        localStorage.setItem("darkMode_TelePilot", data.darkMode.toString());
        if (!tokenStatusChanged) { // Only toast for theme change if token didn't change
             toast({
                title: "Impostazioni Salvate!",
                description: "Le tue preferenze di visualizzazione sono state aggiornate.",
             });
        }
    } else if (!tokenStatusChanged && (data.notificationsEnabled !== form.formState.defaultValues?.notificationsEnabled)) { // Or other settings changed
         toast({
            title: "Impostazioni Salvate!",
            description: "Le tue preferenze sono state aggiornate.",
         });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Connessione Telegram</CardTitle>
              <CardDescription>
                Collega TelePilot al tuo bot Telegram usando il suo token API. Questo token verrà salvato localmente nel tuo browser.
                <strong className="block mt-2">Importante per la Ricerca Gruppi e altre funzionalità server-side:</strong>
                {'Affinché funzionalità come la ricerca di gruppi Telegram funzionino correttamente, questo token API deve essere configurato ANCHE sul server. Crea un file chiamato '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">.env.local</code>
                {' nella cartella principale del progetto (accanto a '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">package.json</code>
                {') e aggiungi la seguente riga, sostituendo '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">IL_TUO_TOKEN_API_QUI</code>
                {' con il tuo token effettivo:'}
                <pre className="mt-2 p-2 bg-muted rounded text-sm">TELEGRAM_BOT_TOKEN=IL_TUO_TOKEN_API_QUI</pre>
                {'Dopo aver creato o modificato il file '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">.env.local</code>
                {', dovrai riavviare il server di sviluppo Next.js.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="telegramToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token API del Bot Telegram</FormLabel>
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input type="password" placeholder="Inserisci il tuo Token API del Bot Telegram" {...field} />
                      </FormControl>
                    </div>
                    <FormDescription>
                      {'Puoi ottenere questo token da '}
                      <Link href="https://core.telegram.org/bots#botfather" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary inline-flex items-center">
                        BotFather su Telegram <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                      {'. Il token inserito qui viene salvato nel tuo browser. Ricorda di impostarlo anche nel file '}
                      <code className="text-xs bg-muted px-0.5 py-0.5 rounded">.env.local</code>
                      {' per le funzionalità server.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {connectionStatus !== "disconnected" && connectionStatus !== "connecting" && currentToken && (
                <div className="flex items-center gap-2 text-sm">
                  {connectionStatus === "connected" && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                  <span className={connectionStatus === "error" ? "text-destructive" : "text-green-500"}>
                    {connectionStatus === "connected" ? "Token salvato localmente." : "Errore di connessione (simulato)."}
                  </span>
                </div>
              )}
               {currentToken && connectionStatus !== "connecting" && (
                <Button variant="outline" type="button" onClick={() => {
                    form.setValue("telegramToken", "", { shouldValidate: true });
                    // Trigger form submission logic to handle token removal
                    form.handleSubmit(onSubmit)();
                }}>
                  Rimuovi Token dalla Memoria Locale
                </Button>
              )}
               {connectionStatus === "connecting" && (
                 <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifica token...
                 </div>
               )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aspetto</CardTitle>
              <CardDescription>Personalizza l'aspetto dell'applicazione.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="darkMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Modalità Scura</FormLabel>
                      <FormDescription>
                        Abilita o disabilita la modalità scura per l'applicazione.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifiche</CardTitle>
              <CardDescription>Gestisci le tue preferenze di notifica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField
                control={form.control}
                name="notificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Abilita Notifiche</FormLabel>
                      <FormDescription>
                        Ricevi notifiche per eventi importanti.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={form.formState.isSubmitting || connectionStatus === 'connecting'}>
            {form.formState.isSubmitting || connectionStatus === 'connecting' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              "Salva Impostazioni"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

    