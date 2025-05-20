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
import { CalendarIcon, Bot, Wand2, Clock } from "lucide-react";
import { format } from "date-fns";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Assume an AI flow for suggestions is available.
// import { getPostSuggestions } from "@/ai/flows"; // This is a placeholder

const schedulerFormSchema = z.object({
  messageContent: z.string().min(1, "Message content cannot be empty.").max(4096, "Message is too long."),
  targetGroups: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one group or channel.",
  }),
  scheduledAtDate: z.date({
    required_error: "A date for scheduling is required.",
  }),
  scheduledAtTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
  useOptimalTiming: z.boolean().default(false).optional(),
});

type SchedulerFormValues = z.infer<typeof schedulerFormSchema>;

// Mock data for groups/channels
const mockTargets = [
  { id: "1", label: "Tech Enthusiasts HQ (Group)" },
  { id: "2", label: "Daily News Updates (Channel)" },
  { id: "3", label: "Marketing Wizards (Group)" },
];

export default function SchedulerPage() {
  const { toast } = useToast();
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    // Combine date and time
    const [hours, minutes] = data.scheduledAtTime.split(':').map(Number);
    const scheduledDateTime = new Date(data.scheduledAtDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    console.log({ ...data, scheduledDateTime }); // Log combined data
    toast({
      title: "Post Scheduled!",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{`Message for ${data.targetGroups.join(', ')} scheduled for ${format(scheduledDateTime, "PPPp")}.`}</code>
        </pre>
      ),
    });
    form.reset();
    setAiSuggestions(null);
  }

  async function handleAiSuggestions() {
    setIsAnalyzing(true);
    setAiSuggestions(null);
    const currentMessage = form.getValues("messageContent");
    const currentTargets = form.getValues("targetGroups");

    // Placeholder for AI call
    // In a real app, you would call your Genkit flow here:
    // const suggestions = await getPostSuggestions({ message: currentMessage, targets: currentTargets });
    // setAiSuggestions(suggestions.text);
    
    // Mock AI response
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setAiSuggestions(
        `For "${mockTargets.find(t => t.id === currentTargets[0])?.label || 'selected targets'}", consider posting around 2 PM for higher engagement. \n\nAlternative phrasing: "${currentMessage.length > 10 ? currentMessage.substring(0,10) + '...' : currentMessage} - What are your thoughts?" This might invite more interaction.`
    );
    setIsAnalyzing(false);
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Schedule a Post</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Message Details</CardTitle>
                  <CardDescription>Craft your message and choose when to send it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="messageContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What's on your mind? Your message will be posted here..."
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
                          <FormLabel className="text-base">Target Groups/Channels</FormLabel>
                          <FormDescription>
                            Select the groups or channels to post this message to.
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
                          <FormLabel>Schedule Date</FormLabel>
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
                                    <span>Pick a date</span>
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
                            <FormLabel>Schedule Time (HH:MM)</FormLabel>
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
                            Use AI Optimal Timing (if available)
                          </FormLabel>
                          <FormDescription>
                            Allow AI to adjust posting time for best engagement. Overrides manual time if suggestions are applied.
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
                  <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> AI Suggestions</CardTitle>
                  <CardDescription>Get AI-powered recommendations to improve your post.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button type="button" variant="outline" onClick={handleAiSuggestions} disabled={isAnalyzing || !form.watch("messageContent") || form.watch("targetGroups").length === 0} className="w-full">
                    {isAnalyzing ? (
                        <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                        </>
                    ) : (
                        <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Get AI Suggestions
                        </>
                    )}
                  </Button>
                  {aiSuggestions && (
                     <Alert>
                        <Wand2 className="h-4 w-4" />
                        <AlertTitle>AI Recommendations</AlertTitle>
                        <AlertDescription className="whitespace-pre-line">
                          {aiSuggestions}
                        </AlertDescription>
                      </Alert>
                  )}
                  {!aiSuggestions && !isAnalyzing && (
                    <p className="text-sm text-muted-foreground text-center py-4">Click the button above to get suggestions for your current message and selected targets.</p>
                  )}
                </CardContent>
              </Card>
              
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Scheduling..." : "Schedule Post"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
