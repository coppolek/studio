"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, TrendingUp, MessageSquare, Users } from "lucide-react";
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

const mockGroupChannelData = {
  "group-1": {
    name: "Tech Enthusiasts HQ",
    messageStats: [
      { date: "2023-01-01", count: 25 }, { date: "2023-01-02", count: 30 },
      { date: "2023-01-03", count: 22 }, { date: "2023-01-04", count: 35 },
      { date: "2023-01-05", count: 40 }, { date: "2023-01-06", count: 28 },
      { date: "2023-01-07", count: 32 },
    ],
    engagement: [
      { date: "2023-01-01", rate: 5.2 }, { date: "2023-01-02", rate: 5.8 },
      { date: "2023-01-03", rate: 4.9 }, { date: "2023-01-04", rate: 6.1 },
      { date: "2023-01-05", rate: 6.5 }, { date: "2023-01-06", rate: 5.5 },
      { date: "2023-01-07", rate: 5.9 },
    ],
  },
  "channel-1": {
    name: "Daily News Updates",
    messageStats: [
      { date: "2023-01-01", count: 50 }, { date: "2023-01-02", count: 55 },
      { date: "2023-01-03", count: 60 }, { date: "2023-01-04", count: 45 },
      { date: "2023-01-05", count: 52 }, { date: "2023-01-06", count: 58 },
      { date: "2023-01-07", count: 65 },
    ],
    engagement: [
      { date: "2023-01-01", rate: 2.1 }, { date: "2023-01-02", rate: 2.3 },
      { date: "2023-01-03", rate: 2.5 }, { date: "2023-01-04", rate: 2.0 },
      { date: "2023-01-05", rate: 2.2 }, { date: "2023-01-06", rate: 2.4 },
      { date: "2023-01-07", rate: 2.7 },
    ],
  },
};

const timeWindows = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

export default function AnalyticsPage() {
  const [selectedGroup, setSelectedGroup] = useState<string>("group-1");
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>("7d");

  const currentData = mockGroupChannelData[selectedGroup as keyof typeof mockGroupChannelData] || mockGroupChannelData["group-1"];
  
  // Adjust data based on time window (simplified)
  const getTimeWindowMultiplier = (tw: string) => {
    if (tw === "30d") return 4;
    if (tw === "90d") return 12;
    return 1;
  };
  const multiplier = getTimeWindowMultiplier(selectedTimeWindow);

  const displayMessageStats = currentData.messageStats.map(d => ({...d, count: d.count * Math.sqrt(multiplier)}));
  const displayEngagement = currentData.engagement.map(d => ({...d, rate: d.rate * (1 + (multiplier-1)*0.1)}));


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select Group/Channel" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(mockGroupChannelData).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTimeWindow} onValueChange={setSelectedTimeWindow}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Time Window" />
            </SelectTrigger>
            <SelectContent>
              {timeWindows.map((tw) => (
                <SelectItem key={tw.value} value={tw.value}>{tw.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayMessageStats.reduce((sum, item) => sum + item.count, 0).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">In selected period for {currentData.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(displayEngagement.reduce((sum, item) => sum + item.rate, 0) / displayEngagement.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Average rate for {currentData.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(2350 * Math.sqrt(multiplier)).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Estimated active users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="message-stats">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="message-stats"><BarChart className="mr-2 h-4 w-4 inline-block" />Message Stats</TabsTrigger>
          <TabsTrigger value="engagement-trends"><TrendingUp className="mr-2 h-4 w-4 inline-block" />Engagement Trends</TabsTrigger>
        </TabsList>
        <TabsContent value="message-stats">
          <Card>
            <CardHeader>
              <CardTitle>Message Volume</CardTitle>
              <CardDescription>Number of messages sent over the selected period for {currentData.name}.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayMessageStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend wrapperStyle={{color: "hsl(var(--foreground))"}} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                     <LabelList dataKey="count" position="top" style={{ fill: 'hsl(var(--foreground))', fontSize: '12px' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="engagement-trends">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Rate Over Time</CardTitle>
              <CardDescription>Engagement rate (%) for {currentData.name}.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayEngagement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                     formatter={(value: number) => [`${value.toFixed(1)}%`, "Engagement"]}
                  />
                  <Legend wrapperStyle={{color: "hsl(var(--foreground))"}} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--accent))" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
