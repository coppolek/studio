
"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, CheckCircle, AlertTriangle, Loader2, ExternalLink, Info } from "lucide-react";
import Image from "next/image";
import type { MockGroup } from "./types"; 
import { searchTelegramGroups, joinTelegramGroup } from "./actions"; 
import Link from "next/link";

export default function GroupsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MockGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [subscribedGroups, setSubscribedGroups] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("subscribedTelegramGroups_TelePilot");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [searchError, setSearchError] = useState<string | null>(null);
  const [initialSearchDone, setInitialSearchDone] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("subscribedTelegramGroups_TelePilot", JSON.stringify(Array.from(subscribedGroups)));
    }
  }, [subscribedGroups]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setInitialSearchDone(true);
      return;
    }
    setIsLoading(true);
    setSearchError(null);
    setInitialSearchDone(true);
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
        if (results.length === 0 && searchQuery.trim()) {
           toast({
            title: "Nessun Risultato",
            description: `Nessun gruppo Telegram trovato per "${searchQuery}". Prova con un'altra ricerca. Assicurati che il token API sia configurato correttamente lato server.`,
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

  const handleJoinGroup = async (group: MockGroup) => {
    setJoiningGroupId(group.id);
    const response = await joinTelegramGroup(group.id, group.name);
    if (response.success) {
        setSubscribedGroups(prev => new Set(prev).add(group.id));
        toast({
          title: "Richiesta Inviata!",
          description: response.message,
        });
    } else {
        toast({
            title: "Iscrizione Fallita",
            description: response.message,
            variant: "destructive",
        });
    }
    setJoiningGroupId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Trova e Unisciti a Gruppi Telegram</h1>

      <Card>
        <CardHeader>
          <CardTitle>Cerca Gruppi su Telegram</CardTitle>
          <CardDescription>
            Inserisci nome o parole chiave per trovare gruppi Telegram a cui unirti.
            Per il funzionamento reale della ricerca tramite API di Telegram, assicurati di aver configurato il Token API del Bot Telegram nelle <Link href="/settings" className="underline hover:text-primary">impostazioni dell'applicazione</Link> e, crucialmente, come variabile d'ambiente <code className="text-xs bg-muted px-0.5 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code> nel file <code className="text-xs bg-muted px-0.5 py-0.5 rounded">.env.local</code> del server.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="Cerca gruppi Telegram per nome o descrizione..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
            className="flex-grow"
            disabled={isLoading}
          />
          <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ricerca...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Cerca su Telegram
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
            <CardContent className="pt-6 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground mt-4">Ricerca in corso su Telegram...</p>
            </CardContent>
        </Card>
      )}

      {!isLoading && searchError && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle /> Errore nella Ricerca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{searchError}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Verifica la console del server per maggiori dettagli. Se il problema riguarda il token API, assicurati che sia valido e configurato correttamente sia nelle <Link href="/settings" className="underline hover:text-primary">impostazioni</Link> sia nel file <code className="text-xs bg-muted px-0.5 py-0.5 rounded">.env.local</code> sul server.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !searchError && searchResults.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {searchResults.map((group) => (
            <Card key={group.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <Image src={group.avatarUrl} alt={group.name} width={48} height={48} className="rounded-full" data-ai-hint="abstract group"/>
                <div className="flex-1">
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription className="flex items-center text-xs">
                    <Users className="mr-1 h-3 w-3 text-muted-foreground" />
                    {group.memberCount.toLocaleString()} membri
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground min-h-[40px] line-clamp-2" title={group.description}>{group.description}</p>
                <Button
                  onClick={() => handleJoinGroup(group)}
                  className="w-full mt-auto"
                  disabled={subscribedGroups.has(group.id) || joiningGroupId === group.id}
                >
                  {joiningGroupId === group.id ? (
                     <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Invio Richiesta...
                      </>
                  ) : subscribedGroups.has(group.id) ? (
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
      
      {!isLoading && !searchError && initialSearchDone && searchResults.length === 0 && (
         <Card>
          <CardContent className="pt-6 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Nessun gruppo Telegram trovato per "{searchQuery}".</p>
            <p className="text-sm text-muted-foreground mt-1">
                Prova con un termine di ricerca differente. Se continui a non trovare risultati, verifica la configurazione del token API di Telegram nelle <Link href="/settings" className="underline hover:text-primary">impostazioni</Link> e assicurati che il file <code className="text-xs bg-muted px-0.5 py-0.5 rounded">.env.local</code> sia corretto sul server.
            </p>
          </CardContent>
        </Card>
      )}

       {!isLoading && !searchError && !initialSearchDone && searchResults.length === 0 && (
         <Card>
          <CardContent className="pt-6 text-center">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Inserisci un termine di ricerca per trovare gruppi su Telegram.</p>
            <p className="text-sm text-muted-foreground mt-1">La ricerca verrà effettuata tramite le API di Telegram se il token è configurato correttamente sia nelle <Link href="/settings" className="underline hover:text-primary">impostazioni</Link> che nel file <code className="text-xs bg-muted px-0.5 py-0.5 rounded">.env.local</code> del server.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    