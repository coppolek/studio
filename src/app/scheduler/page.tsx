
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarIcon, Bot, Wand2, Clock, Loader2 } from "lucide-react"; // Added Loader2
import { format } from "date-fns";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { schedulePostAction, type ScheduledPostInput } from "./actions"; // Import the server action
import { getPostSuggestion } from "@/ai/flows/post-suggestion-flow"; // Import the Genkit flow

const schedulerFormSchema = z.object({
  messageContent: z.string().min(1, "Il contenuto del messaggio non può essere vuoto.").max(4096, "Messaggio troppo lungo."),
  targetGroups: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Devi selezionare almeno un gruppo o canale.",
  }),
  scheduledAtDate: z.date({
    required_error: "È richiesta una data per la pianificazione.",
  }),
  scheduledAtTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato ora non valido (HH:MM)."),
  useOptimalTiming: z.boolean().default(false).optional(),
});

type SchedulerFormValues = z.infer<typeof schedulerFormSchema>;

// Mock data for groups/channels
const mockTargets = [
  { id: "group-1", label: "Tech Enthusiasts HQ (Gruppo)" },
  { id: "channel-1", label: "Daily News Updates (Canale)" },
  { id: "group-2", label: "Marketing Wizards (Gruppo)" },
];

export default function SchedulerPage() {
  const { toast } = useToast();
  const [aiSuggestionText, setAiSuggestionText] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SchedulerFormValues>({
    resolver: zodResolver(schedulerFormSchema),
    defaultValues: {
      messageContent: "",
      targetGroups: [],
      scheduledAtTime: "10:00",
      useOptimalTiming: false,
    },
  });

  async function onSubmit(data: SchedulerFormValues) {
    setIsSubmitting(true);
    const [hours, minutes] = data.scheduledAtTime.split(':').map(Number);
    const scheduledDateTime = new Date(data.scheduledAtDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const postToSave: ScheduledPostInput = {
      messageContent: data.messageContent,
      targetGroups: data.targetGroups,
      scheduledAt: scheduledDateTime,
      useOptimalTiming: data.useOptimalTiming,
      status: 'pending',
    };
    
    const result = await schedulePostAction(postToSave);

    if (result.success) {
      toast({
        title: "Post Pianificato!",
        description: `Il tuo post è stato salvato e verrà inviato il ${format(scheduledDateTime, "PPPp")}. ID Post: ${result.postId}`,
      });
      form.reset();
      setAiSuggestionText(null);
    } else {
      toast({
        title: "Errore nella Pianificazione",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  }

  async function handleAiSuggestions() {
    setIsAnalyzing(true);
    setAiSuggestionText(null);
    const currentMessage = form.getValues("messageContent");
    // For simplicity, we'll pass a generic audience type.
    // In a real app, you might derive this from selected targetGroups.
    const targetAudienceDescription = form.getValues("targetGroups").length > 0 
        ? mockTargets.find(t => t.id === form.getValues("targetGroups")[0])?.label || "un target generico"
        : "un target generico";

    if (!currentMessage) {
        toast({ title: "Contenuto Mancante", description: "Scrivi un messaggio prima di chiedere suggerimenti.", variant: "destructive"});
        setIsAnalyzing(false);
        return;
    }
    
    try {
      const suggestions = await getPostSuggestion({ 
        messageContent: currentMessage, 
        targetAudienceInfo: `Destinato a: ${targetAudienceDescription}`
      });
      setAiSuggestionText(suggestions.suggestion);
    } catch (error: any) {
      console.error("Errore nel ricevere suggerimenti AI:", error);
      setAiSuggestionText("Errore nel caricare i suggerimenti. Riprova più tardi.");
       toast({
        title: "Errore Suggerimenti AI",
        description: error.message || "Impossibile ottenere suggerimenti in questo momento.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pianifica un Post</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Dettagli Messaggio</CardTitle>
                  <CardDescription>Crea il tuo messaggio e scegli quando inviarlo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="messageContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contenuto Messaggio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cosa hai in mente? Il tuo messaggio verrà postato qui..."
                            className="min-h-[150px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetGroups"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Gruppi/Canali Target</FormLabel>
                          <FormDescription>
                            Seleziona i gruppi o canali a cui inviare questo messaggio.
                          </FormDescription>
                        </div>
                        {mockTargets.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="targetGroups"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="scheduledAtDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data Pianificazione</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Scegli una data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="scheduledAtTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ora Pianificazione (HH:MM)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="time" {...field} className="pl-10" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="useOptimalTiming"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Usa Tempistica Ottimale AI (se disponibile)
                          </FormLabel>
                          <FormDescription>
                            Permetti all'AI di aggiustare l'ora di invio per il miglior engagement. Sovrascrive l'ora manuale se i suggerimenti vengono applicati.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Suggerimenti AI</CardTitle>
                  <CardDescription>Ottieni raccomandazioni AI per migliorare il tuo post.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button type="button" variant="outline" onClick={handleAiSuggestions} disabled={isAnalyzing || !form.watch("messageContent")} className="w-full">
                    {isAnalyzing ? (
                        <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        Analisi in corso...
                        </>
                    ) : (
                        <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Ottieni Suggerimenti AI
                        </>
                    )}
                  </Button>
                  {aiSuggestionText && (
                     <Alert>
                        <Wand2 className="h-4 w-4" />
                        <AlertTitle>Raccomandazioni AI</AlertTitle>
                        <AlertDescription className="whitespace-pre-line">
                          {aiSuggestionText}
                        </AlertDescription>
                      </Alert>
                  )}
                  {!aiSuggestionText && !isAnalyzing && (
                    <p className="text-sm text-muted-foreground text-center py-4">Clicca il pulsante sopra per ottenere suggerimenti per il tuo messaggio e i target selezionati.</p>
                  )}
                </CardContent>
              </Card>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Pianificazione...
                  </>
                ) : "Pianifica Post"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
