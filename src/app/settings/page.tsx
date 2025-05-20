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
import { KeyRound, CheckCircle, XCircle, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";

const settingsFormSchema = z.object({
  telegramToken: z.string().min(20, "Token seems too short.").max(100, "Token seems too long.").optional().or(z.literal('')),
  darkMode: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// Mock connection status
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export default function SettingsPage() {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);


  useEffect(() => {
    // Simulate loading saved token and dark mode preference
    const savedToken = localStorage.getItem("telegramBotToken_TelePilot");
    if (savedToken) {
      setCurrentToken(savedToken);
      setConnectionStatus("connected"); // Assume connected if token exists
      form.setValue("telegramToken", savedToken);
    }
    const darkModePreference = localStorage.getItem("darkMode_TelePilot");
    if (darkModePreference) {
      const newIsDarkMode = darkModePreference === 'true';
      setIsDarkMode(newIsDarkMode);
      form.setValue("darkMode", newIsDarkMode);
      document.documentElement.classList.toggle("dark", newIsDarkMode);
    } else {
      // Default to system preference or dark if not set
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      form.setValue("darkMode", prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);


  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      telegramToken: currentToken || "",
      darkMode: isDarkMode,
      notificationsEnabled: true,
    },
  });

  async function onSubmit(data: SettingsFormValues) {
    if (data.telegramToken && data.telegramToken !== currentToken) {
      setConnectionStatus("connecting");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Simulate success/failure
      const success = Math.random() > 0.2; // 80% chance of success
      if (success) {
        localStorage.setItem("telegramBotToken_TelePilot", data.telegramToken);
        setCurrentToken(data.telegramToken);
        setConnectionStatus("connected");
        toast({
          title: "Telegram Connected!",
          description: "Successfully connected to Telegram with the new token.",
          variant: "default",
        });
      } else {
        setConnectionStatus("error");
        toast({
          title: "Connection Failed",
          description: "Could not connect to Telegram. Please check your token.",
          variant: "destructive",
        });
      }
    } else if (!data.telegramToken && currentToken) {
        // Disconnecting
        localStorage.removeItem("telegramBotToken_TelePilot");
        setCurrentToken(null);
        setConnectionStatus("disconnected");
        form.reset({telegramToken: "", darkMode: data.darkMode, notificationsEnabled: data.notificationsEnabled});
        toast({
          title: "Telegram Disconnected",
          description: "Bot token has been removed.",
        });
    } else {
         toast({
            title: "Settings Saved!",
            description: "Your preferences have been updated.",
         });
    }
    if (data.darkMode !== undefined && data.darkMode !== isDarkMode) {
        setIsDarkMode(data.darkMode);
        document.documentElement.classList.toggle("dark", data.darkMode);
        localStorage.setItem("darkMode_TelePilot", data.darkMode.toString());
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Connection</CardTitle>
              <CardDescription>
                Connect TelePilot to your Telegram bot using its API token.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="telegramToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot API Token</FormLabel>
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input type="password" placeholder="Enter your Telegram Bot API Token" {...field} />
                      </FormControl>
                    </div>
                    <FormDescription>
                      You can get this token from BotFather on Telegram.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {connectionStatus !== "disconnected" && connectionStatus !== "connecting" && (
                <div className="flex items-center gap-2 text-sm">
                  {connectionStatus === "connected" && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                  <span className={connectionStatus === "error" ? "text-red-500" : "text-green-500"}>
                    {connectionStatus === "connected" ? "Successfully connected to Telegram." : "Connection error. Please verify your token."}
                  </span>
                </div>
              )}
               {currentToken && connectionStatus !== "connecting" && (
                <Button variant="outline" type="button" onClick={() => form.setValue("telegramToken", "", { shouldValidate: true })}>
                  Disconnect and Remove Token
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="darkMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Dark Mode</FormLabel>
                      <FormDescription>
                        Enable or disable dark mode for the application.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
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
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField
                control={form.control}
                name="notificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Notifications</FormLabel>
                      <FormDescription>
                        Receive notifications for important events.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
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
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
