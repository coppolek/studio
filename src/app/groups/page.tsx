
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, CheckCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";
import type { MockGroup } from "./types"; // Import from new types file
import { searchTelegramGroups } from "./actions"; // Import server action

export default function GroupsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MockGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subscribedGroups, setSubscribedGroups] = useState<Set<string>>(new Set());
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setIsLoading(true);
    setSearchError(null);
    try {
      const results = await searchTelegramGroups(searchQuery);
      if ('error' in results) {
        setSearchError(results.error);
        setSearchResults([]);
        toast({
          title: "Errore nella Ricerca",
          description: results.error,
          variant: "destructive",
        });
      } else {
        setSearchResults(results);
        if (results.length === 0) {
           toast({
            title: "Nessun Risultato",
            description: `Nessun gruppo Telegram trovato per "${searchQuery}". Prova con un'altra ricerca.`,
          });
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Un errore imprevisto è accaduto durante la ricerca.";
      setSearchError(errorMessage);
      setSearchResults([]);
      toast({
        title: "Ricerca Fallita",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = (group: MockGroup) => {
    // Simulate joining group
    setSubscribedGroups(prev => new Set(prev).add(group.id));
    toast({
      title: "Richiesta di Iscrizione Inviata",
      description: `La tua richiesta di iscriverti al gruppo Telegram "${group.name}" è stata inviata. (Azione simulata)`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Trova e Unisciti a Gruppi Telegram</h1>

      <Card>
        <CardHeader>
          <CardTitle>Cerca Gruppi su Telegram</CardTitle>
          <CardDescription>Inserisci nome o parole chiave per trovare gruppi Telegram a cui unirti. La ricerca effettiva su Telegram non è ancora implementata.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="Cerca gruppi Telegram per nome o descrizione..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-grow"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? "Ricerca su Telegram..." : "Cerca"}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-8">
          <Search className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
          <p className="text-lg text-muted-foreground mt-4">Ricerca in corso...</p>
        </div>
      )}

      {!isLoading && searchError && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle /> Errore nella Ricerca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{searchError}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              La ricerca effettiva tramite API di Telegram non è ancora implementata o potrebbe esserci un problema di configurazione.
              Per ora, i risultati sono simulati.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !searchError && searchResults.length > 0 && (
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
                      Richiesta Inviata
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

      {!isLoading && !searchError && searchQuery && searchResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">Nessun gruppo Telegram trovato per "{searchQuery}". Prova con un'altra ricerca.</p>
          <p className="text-sm text-muted-foreground mt-2">(Nota: i risultati della ricerca sono attualmente simulati)</p>
        </div>
      )}
       {!isLoading && !searchError && !searchQuery && searchResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">Inserisci un termine di ricerca per trovare gruppi su Telegram.</p>
           <p className="text-sm text-muted-foreground mt-2">(Nota: i risultati della ricerca sono attualmente simulati)</p>
        </div>
      )}
    </div>
  );
}
