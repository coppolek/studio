import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListChecks, Users, MessageCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface GroupChannel {
  id: string;
  name: string;
  type: "group" | "channel";
  memberCount: number;
  lastActivity: string;
  avatarUrl: string;
}

const mockGroupsChannels: GroupChannel[] = [
  { id: "1", name: "Tech Enthusiasts HQ", type: "group", memberCount: 1256, lastActivity: "2 mins ago", avatarUrl: "https://placehold.co/64x64.png?text=TE" },
  { id: "2", name: "Daily News Updates", type: "channel", memberCount: 8700, lastActivity: "15 mins ago", avatarUrl: "https://placehold.co/64x64.png?text=DN" },
  { id: "3", name: "Marketing Wizards", type: "group", memberCount: 450, lastActivity: "1 hour ago", avatarUrl: "https://placehold.co/64x64.png?text=MW" },
  { id: "4", name: "Crypto Signals", type: "channel", memberCount: 23000, lastActivity: "5 mins ago", avatarUrl: "https://placehold.co/64x64.png?text=CS" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/scheduler">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Schedule Post
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockGroupsChannels.filter(gc => gc.type === 'group').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Managed Telegram groups
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockGroupsChannels.filter(gc => gc.type === 'channel').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Managed Telegram channels
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Upcoming messages
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Engagement</CardTitle>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+25%</div>
            <p className="text-xs text-muted-foreground">
              vs. last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Groups & Channels</CardTitle>
          <CardDescription>
            Overview of your connected Telegram entities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockGroupsChannels.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Image src={item.avatarUrl} alt={item.name} data-ai-hint="logo abstract" width={40} height={40} className="rounded-full" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{item.type} &bull; {item.memberCount.toLocaleString()} members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last activity</p>
                  <p className="text-sm">{item.lastActivity}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
