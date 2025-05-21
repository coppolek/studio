
'use server';

import type { MockGroup } from './types';
import { Telegraf } from 'telegraf';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, Timestamp, deleteDoc, getDoc, query, where } from 'firebase/firestore';

// Dati mock che verranno usati solo se la ricerca reale non è implementata o fallisce
const allMockGroupsForFallback: MockGroup[] = [
  { id: "group1", name: "Tech Innovators Forum (Mock)", memberCount: 1203, description: "Discuss the latest in tech and innovation.", avatarUrl: "https://placehold.co/64x64.png?text=TIF" },
  { id: "group2", name: "Startup Founders Hub (Mock)", memberCount: 875, description: "A community for startup founders to share ideas.", avatarUrl: "https://placehold.co/64x64.png?text=SFH" },
  { id: "group3", name: "NextJS Developers (Mock)", memberCount: 2450, description: "All things NextJS, React, and web development.", avatarUrl: "https://placehold.co/64x64.png?text=NJD" },
  { id: "typescript_telegram", name: "TypeScript Telegram (Esempio Reale API)", memberCount: 0, description: "Official Telegram group for TypeScript. (Cerca con '@typescript_telegram' per testare l'API getChat)", avatarUrl: "https://placehold.co/64x64.png?text=TS" },
];

let bot: Telegraf | null = null;
const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (botToken) {
  bot = new Telegraf(botToken);
  console.log("Istanza bot Telegraf inizializzata usando TELEGRAM_BOT_TOKEN.");
  bot.telegram.getMe().then((botInfo) => {
    console.log(`Connesso con successo a Telegram. Info Bot: ${botInfo.first_name} (@${botInfo.username}, ID: ${botInfo.id})`);
  }).catch(err => {
    console.warn(`Bot Telegraf inizializzato, ma impossibile verificare info bot con Telegram (getMe fallito). Errore: ${err.message}. Assicurati che il token sia corretto e il bot esista.`);
  });
} else {
  console.warn("TELEGRAM_BOT_TOKEN non trovato in .env.local. Le chiamate API Telegram verranno saltate, usando dati mock o simulazioni. Imposta questa variabile d'ambiente per la piena funzionalità.");
}

export async function searchTelegramGroups(searchQuery: string): Promise<MockGroup[] | { error: string }> {
  console.log(`Ricerca Server per gruppi Telegram con query: ${searchQuery}`);

  if (!bot || !botToken) {
    console.warn("Bot Telegram non inizializzato o token non disponibile. Ritorno a ricerca mock.");
    if (!searchQuery.trim()) return [];
    await new Promise(resolve => setTimeout(resolve, 300)); 
    const lowerCaseQuery = searchQuery.toLowerCase();
    const mockResults = allMockGroupsForFallback.filter(group =>
        group.name.toLowerCase().includes(lowerCaseQuery) ||
        group.description.toLowerCase().includes(lowerCaseQuery) ||
        group.id.toLowerCase().includes(lowerCaseQuery)
    );
     if (mockResults.length === 0) {
        return { error: `Nessun gruppo mock trovato per "${searchQuery}". Nota: La ricerca API Telegram generica non è supportata. Prova con un @username specifico o ID gruppo per una ricerca API diretta.` };
    }
    return mockResults;
  }

  // Tentativo di ricerca "reale" se la query è un ID o un @username
  const isSpecificIdentifier = searchQuery.startsWith("@") || (!isNaN(Number(searchQuery)) && searchQuery.trim() !== "");

  if (isSpecificIdentifier) {
    try {
      console.log(`Tentativo di getChat per identificatore specifico: ${searchQuery}`);
      const chat = await bot.telegram.getChat(searchQuery);
      // @ts-ignore 
      const title = chat.title || 'N/D';
      // @ts-ignore
      const description = chat.description || 'Descrizione non disponibile tramite getChat diretto.';
      let memberCount = 0;
      try {
         // @ts-ignore
        memberCount = await bot.telegram.getChatMembersCount(chat.id);
      } catch (mcError: any) {
        console.warn(`Impossibile ottenere numero membri per ${chat.id} (${title}):`, mcError.message);
      }
      
      const groupResult: MockGroup = {
        // @ts-ignore
        id: chat.id.toString(),
        name: title,
        memberCount: memberCount,
        description: description,
        avatarUrl: `https://placehold.co/64x64.png?text=${title.substring(0,2).toUpperCase()}`
      };
      console.log(`Info recuperate con successo per '${searchQuery}' da Telegram:`, groupResult.name);
      return [groupResult];
    } catch (error: any) {
      console.error(`Errore chiamata getChat per '${searchQuery}':`, error.message);
      const errorMessage = `Fallito recupero info per '${searchQuery}' da Telegram. Potrebbe essere privato, inesistente, o il bot non ha permessi. Il bot potrebbe necessitare di essere membro del gruppo/canale. Dettagli: ${error.description || error.message}`;
      console.warn(`getChat per '${searchQuery}' fallito. Ritorno a ricerca mock per questa query specifica. Errore: ${error.description || error.message}`);
      return { error: errorMessage };
    }
  }
  
  console.warn(`Utilizzo dati mock per ricerca generica con parola chiave "${searchQuery}" poiché l'API Bot Telegram non supporta ricerche pubbliche ampie per parola chiave. Filtro dati mock.`);
  if (!searchQuery.trim()) return [];
  await new Promise(resolve => setTimeout(resolve, 300));
  const lowerCaseQuery = searchQuery.toLowerCase();
  const filteredMock = allMockGroupsForFallback.filter(group =>
    group.name.toLowerCase().includes(lowerCaseQuery) ||
    group.description.toLowerCase().includes(lowerCaseQuery) ||
    group.id.toLowerCase().includes(lowerCaseQuery)
  );

  if (filteredMock.length === 0) {
    return { error: `Nessun gruppo mock trovato per "${searchQuery}". Nota: La ricerca API Telegram generica non è supportata. Prova con un @username specifico o ID gruppo per una ricerca API diretta.` };
  }
  return filteredMock;
}

export async function joinTelegramGroup(group: MockGroup): Promise<{ success: boolean; message: string; telegramVerified: boolean }> {
  console.log(`Tentativo di 'iscrizione' gruppo ${group.name} (ID: ${group.id}) e salvataggio su Firestore.`);
  let telegramVerified = false;
  let verificationMessage = "I dettagli del gruppo non sono stati verificati con l'API Telegram (il token bot potrebbe non essere configurato, il bot potrebbe non essere membro, il gruppo è privato, o errore API).";

  if (bot && botToken) {
    try {
      console.log(`Verifica gruppo ${group.id} con API Telegram.`);
      const chat = await bot.telegram.getChat(group.id); 
      // @ts-ignore
      const chatTitle = chat.title || group.name;
      console.log(`Verifica API Telegram riuscita per ${chatTitle}.`);
      verificationMessage = `Gruppo '${chatTitle}' verificato con successo tramite API Telegram.`;
      telegramVerified = true;
    } catch (apiError: any) {
      console.error(`Errore verifica gruppo ${group.id} con Telegram:`, apiError.message);
      verificationMessage = `Impossibile verificare gruppo '${group.name}' (ID: ${group.id}) con Telegram. Potrebbe essere privato, inesistente, il bot non ha permessi, o formato ID errato per uso API. Errore: ${apiError.description || apiError.message}`;
    }
  } else {
    console.warn("Bot Telegram non inizializzato. Salto verifica API Telegram.");
    verificationMessage = "Verifica API Telegram saltata perché il token bot non è configurato (TELEGRAM_BOT_TOKEN mancante in .env.local).";
  }

  try {
    const groupRef = doc(db, "subscribedGroups", group.id.toString());
    const docSnap = await getDoc(groupRef);
    if (docSnap.exists()) {
        console.log(`Gruppo ${group.name} già presente in Firestore. Stato verifica: ${telegramVerified}`);
        return { 
            success: true, 
            message: `Gruppo "${group.name}" è già salvato in Firestore. ${verificationMessage}`,
            telegramVerified 
        };
    }
    await setDoc(groupRef, {
      name: group.name,
      memberCount: group.memberCount,
      description: group.description,
      avatarUrl: group.avatarUrl,
      telegramChatId: group.id, // Assicurati che l'ID sia quello corretto di Telegram
      subscribedAt: Timestamp.now(),
      // Aggiungi un campo per lo stato della verifica API, se vuoi tracciarlo
      apiVerified: telegramVerified 
    });
    console.log(`Gruppo ${group.name} salvato su Firestore.`);
    return { 
      success: true, 
      message: `Gruppo "${group.name}" salvato su Firestore. ${verificationMessage}`,
      telegramVerified 
    };
  } catch (error: any) {
    console.error("Errore salvataggio gruppo su Firestore:", error);
    return { 
      success: false, 
      message: `Errore salvataggio gruppo "${group.name}" su Firestore: ${error.message}`,
      telegramVerified
    };
  }
}

export async function getStoredSubscribedGroupIds(): Promise<string[]> {
  try {
    const groupsCollectionRef = collection(db, "subscribedGroups");
    const querySnapshot = await getDocs(groupsCollectionRef);
    const groupIds = querySnapshot.docs.map(docData => docData.id); 
    console.log("ID gruppi sottoscritti recuperati da Firestore:", groupIds);
    return groupIds;
  } catch (error) {
    console.error("Errore recupero ID gruppi sottoscritti da Firestore:", error);
    return [];
  }
}

export async function leaveTelegramGroup(groupId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Tentativo di annullare iscrizione da gruppo ID: ${groupId} e rimozione da Firestore.`);
  try {
    const groupRef = doc(db, "subscribedGroups", groupId);
    const docSnap = await getDoc(groupRef);
    if (docSnap.exists()) {
      await deleteDoc(groupRef);
      console.log(`Gruppo ${groupId} rimosso da Firestore.`);
      return { success: true, message: "Iscrizione annullata e gruppo rimosso dalla gestione app." };
    } else {
      console.warn(`Gruppo ${groupId} non trovato nella lista sottoscritti Firestore durante operazione di annullamento.`);
      return { success: false, message: "Gruppo non trovato nella lista sottoscritti da rimuovere."};
    }
  } catch (error: any) {
    console.error("Errore rimozione gruppo da Firestore:", error);
    return { success: false, message: `Errore annullamento iscrizione: ${error.message}` };
  }
}
