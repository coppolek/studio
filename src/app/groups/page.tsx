
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Not used directly, Image is used.
import { useToast } from "@/hooks/use-toast";
import { Search, Users, CheckCircle, AlertTriangle, Loader2, ExternalLink, Info, LogOut } from "lucide-react";
import Image from "next/image";
import type { MockGroup } from "./types"; 
import { searchTelegramGroups, joinTelegramGroup, getStoredSubscribedGroupIds, leaveTelegramGroup } from "./actions"; 
import Link from "next/link";

export default function GroupsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MockGroup[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [actionGroupId, setActionGroupId] = useState<string | null>(null); // For join/leave loading state
  const [subscribedGroupIds, setSubscribedGroupIds] = useState<Set<string>>(new Set());
  const [isLoadingSubscribed, setIsLoadingSubscribed] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [initialSearchDone, setInitialSearchDone] = useState(false);
  
  const fetchSubscribedGroups = useCallback(async () => {
    setIsLoadingSubscribed(true);
    try {
      const ids = await getStoredSubscribedGroupIds();
      setSubscribedGroupIds(new Set(ids));
    } catch (error) {
      console.error("Failed to fetch subscribed groups:", error);
      toast({
        title: "Errore nel Caricamento delle Iscrizioni",
        description: "Impossibile caricare i gruppi a cui sei iscritto da Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSubscribed(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubscribedGroups();
  }, [fetchSubscribedGroups]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError("Inserisci un termine di ricerca.");
      setInitialSearchDone(true);
      return;
    }
    setIsLoadingSearch(true);
    setSearchError(null);
    setInitialSearchDone(true);
    try {
      const results = await searchTelegramGroups(searchQuery);
      if ('error' in results) {
        setSearchError(results.error);
        setSearchResults([]);
         toast({
          title: "Informazione Ricerca",
          description: results.error, // Error message might contain useful info
          variant: "default", 
        });
      } else {
        setSearchResults(results);
        if (results.length === 0 && searchQuery.trim()) {
           toast({
            title: "Nessun Risultato",
            description: `Nessun gruppo Telegram trovato per "${searchQuery}". Prova con un'altra ricerca, o con un @username specifico. Assicurati che il token API sia configurato correttamente.`,
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
      setIsLoadingSearch(false);
    }
  };

  const handleJoinGroup = async (group: MockGroup) => {
    setActionGroupId(group.id);
    const response = await joinTelegramGroup(group);
    if (response.success) {
        setSubscribedGroupIds(prev => new Set(prev).add(group.id.toString()));
        toast({
          title: response.telegramVerified ? "Gruppo Verificato e Salvato!" : "Gruppo Salvato (Verifica Parziale)",
          description: response.message,
          variant: response.telegramVerified ? "default" : "default", // Could be 'warning' if not verified
        });
    } else {
        toast({
            title: "Operazione Fallita",
            description: response.message,
            variant: "destructive",
        });
    }
    setActionGroupId(null);
  };

  const handleLeaveGroup = async (groupId: string) => {
    setActionGroupId(groupId);
    const response = await leaveTelegramGroup(groupId);
     if (response.success) {
        setSubscribedGroupIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(groupId.toString());
            return newSet;
        });
        toast({
          title: "Iscrizione Annullata",
          description: response.message,
        });
    } else {
        toast({
            title: "Operazione Fallita",
            description: response.message,
            variant: "destructive",
        });
    }
    setActionGroupId(null);
  };


  if (isLoadingSubscribed) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Caricamento iscrizioni da Firestore...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Trova e Gestisci Gruppi Telegram</h1>

      <Card>
        <CardHeader>
          <CardTitle>Cerca Gruppi su Telegram</CardTitle>
          <CardDescription>
            Inserisci nome, parole chiave o un identificatore specifico (es. <code className="text-xs bg-muted px-0.5 py-0.5 rounded">@username</code> o ID numerico del gruppo) per trovare gruppi Telegram.
            La ricerca con ID specifici interrogherà direttamente le API di Telegram (se il token è configurato). Ricerche generiche useranno dati di esempio.
            {' Per il funzionamento reale delle API, assicurati di aver configurato il Token API del Bot Telegram nelle '}
            <Link href="/settings" className="underline hover:text-primary">impostazioni dell'applicazione</Link>
            {' e, crucialmente, come variabile d\'ambiente '}
            <code className="text-xs bg-muted px-0.5 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code>
            {' nel file '}
            <code className="text-xs bg-muted px-0.5 py-0.5 rounded">.env.local</code>
            {' del server. Le iscrizioni e le verifiche API verranno salvate e tentate tramite Firestore e API Telegram.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="Cerca gruppi: nome, @username, ID numerico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoadingSearch && handleSearch()}
            className="flex-grow"
            disabled={isLoadingSearch}
          />
          <Button onClick={handleSearch} disabled={isLoadingSearch || !searchQuery.trim()}>
            {isLoadingSearch ? (
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

      {isLoadingSearch && ( 
        <Card>
            <CardContent className="pt-6 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground mt-4">Ricerca in corso...</p>
            </CardContent>
        </Card>
      )}

      {!isLoadingSearch && searchError && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle /> Informazioni Ricerca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{searchError}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Verifica la console del server per maggiori dettagli. Se il problema riguarda il token API, assicurati che sia valido e configurato correttamente sia nelle <Link href="/settings" className="underline hover:text-primary">impostazioni</Link> sia nel file <code className="text-xs bg-muted px-0.5 py-0.5 rounded">.env.local</code> sul server. Le ricerche API dirette funzionano meglio con <code className="text-xs bg-muted px-0.5 py-0.5 rounded">@username</code> o ID numerici.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoadingSearch && !searchError && searchResults.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {searchResults.map((group) => (
            <Card key={group.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <Image src={group.avatarUrl} alt={group.name} width={48} height={48} className="rounded-full" data-ai-hint="abstract group"/>
                <div className="flex-1">
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription className="flex items-center text-xs">
                    <Users className="mr-1 h-3 w-3 text-muted-foreground" />
                    {group.memberCount > 0 ? group.memberCount.toLocaleString() + ' membri' : 'N/D membri'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground min-h-[40px] line-clamp-2" title={group.description}>{group.description}</p>
                {subscribedGroupIds.has(group.id.toString()) ? (
                     <Button
                        onClick={() => handleLeaveGroup(group.id.toString())}
                        variant="outline"
                        className="w-full mt-auto"
                        disabled={actionGroupId === group.id.toString()}
                    >
                        {actionGroupId === group.id.toString() ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Annullamento...
                            </>
                        ) : (
                            <>
                                <LogOut className="mr-2 h-4 w-4" />
                                Annulla Iscrizione App
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                    onClick={() => handleJoinGroup(group)}
                    className="w-full mt-auto"
                    disabled={actionGroupId === group.id.toString()}
                    >
                    {actionGroupId === group.id.toString() ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Elaborazione...
                        </>
                    ) : (
                        "Salva e Verifica Gruppo"
                    )}
                    </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {!isLoadingSearch && !searchError && initialSearchDone && searchResults.length === 0 && searchQuery.trim() && (
         <Card>
          <CardContent className="pt-6 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Nessun gruppo Telegram trovato per "{searchQuery}".</p>
            <p className="text-sm text-muted-foreground mt-1">
                Prova con un termine di ricerca differente, preferibilmente un <code className="text-xs bg-muted px-0.5 py-0.5 rounded">@username</code> o ID numerico del gruppo per una ricerca API diretta. 
                Verifica la configurazione del token API di Telegram nelle <Link href="/settings" className="underline hover:text-primary">impostazioni</Link> e assicurati che il file <code className="text-xs bg-muted px-0.5 py-0.5 rounded">.env.local</code> sia corretto sul server.
            </p>
          </CardContent>
        </Card>
      )}

       {!isLoadingSearch && !searchError && !initialSearchDone && searchResults.length === 0 && (
         <Card>
          <CardContent className="pt-6 text-center">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Inserisci un termine di ricerca per trovare gruppi su Telegram.</p>
            <p className="text-sm text-muted-foreground mt-1">
                Le ricerche con <code className="text-xs bg-muted px-0.5 py-0.5 rounded">@username</code> o ID numerici tenteranno una chiamata API diretta a Telegram.
                Le iscrizioni vengono salvate su Firestore e verrà tentata una verifica API del gruppo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
