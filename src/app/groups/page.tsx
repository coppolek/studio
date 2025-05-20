
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, CheckCircle } from "lucide-react";
import Image from "next/image";

interface MockGroup {
  id: string;
  name: string;
  memberCount: number;
  description: string;
  avatarUrl: string;
}

const allMockGroups: MockGroup[] = [
  { id: "group1", name: "Tech Innovators Forum", memberCount: 1203, description: "Discuss the latest in tech and innovation.", avatarUrl: "https://placehold.co/64x64.png?text=TIF" },
  { id: "group2", name: "Startup Founders Hub", memberCount: 875, description: "A community for startup founders to share ideas.", avatarUrl: "https://placehold.co/64x64.png?text=SFH" },
  { id: "group3", name: "NextJS Developers", memberCount: 2450, description: "All things NextJS, React, and web development.", avatarUrl: "https://placehold.co/64x64.png?text=NJD" },
  { id: "group4", name: "Remote Work Life", memberCount: 560, description: "Tips and tricks for a successful remote career.", avatarUrl: "https://placehold.co/64x64.png?text=RWL" },
  { id: "group5", name: "AI Enthusiasts Collective", memberCount: 1800, description: "Exploring the frontiers of Artificial Intelligence.", avatarUrl: "https://placehold.co/64x64.png?text=AEC" },
];

export default function GroupsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MockGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subscribedGroups, setSubscribedGroups] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const filteredGroups = allMockGroups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filteredGroups);
      setIsLoading(false);
    }, 1000);
  };

  const handleJoinGroup = (group: MockGroup) => {
    // Simulate joining group
    setSubscribedGroups(prev => new Set(prev).add(group.id));
    toast({
      title: "Iscrizione Richiesta",
      description: `Richiesta di iscrizione al gruppo "${group.name}" inviata. (Azione simulata)`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Scopri e Unisciti ai Gruppi</h1>

      <Card>
        <CardHeader>
          <CardTitle>Cerca Gruppi</CardTitle>
          <CardDescription>Trova gruppi Telegram a cui unirti.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="Cerca gruppi per nome o descrizione..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-grow"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? "Ricerca..." : "Cerca"}
          </Button>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {searchResults.map((group) => (
            <Card key={group.id}>
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <Image src={group.avatarUrl} alt={group.name} width={48} height={48} className="rounded-full" data-ai-hint="abstract group" />
                <div className="flex-1">
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription className="flex items-center">
                    <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                    {group.memberCount.toLocaleString()} membri
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground min-h-[40px]">{group.description}</p>
                <Button 
                  onClick={() => handleJoinGroup(group)} 
                  className="w-full"
                  disabled={subscribedGroups.has(group.id)}
                >
                  {subscribedGroups.has(group.id) ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Iscritto
                    </>
                  ) : (
                    "Iscriviti al Gruppo"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && searchQuery && searchResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">Nessun gruppo trovato per "{searchQuery}". Prova con un'altra ricerca.</p>
        </div>
      )}
       {!isLoading && !searchQuery && searchResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">Inserisci un termine di ricerca per trovare gruppi.</p>
        </div>
      )}
    </div>
  );
}
