
'use server';

import type { MockGroup } from './types';
import { Telegraf } from 'telegraf'; // Importa Telegraf
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, Timestamp, deleteDoc, getDoc } from 'firebase/firestore';

// Dati mock che verranno usati solo se la ricerca reale non è implementata o fallisce
const allMockGroupsForFallback: MockGroup[] = [
  { id: "group1", name: "Tech Innovators Forum", memberCount: 1203, description: "Discuss the latest in tech and innovation.", avatarUrl: "https://placehold.co/64x64.png?text=TIF" },
  { id: "group2", name: "Startup Founders Hub", memberCount: 875, description: "A community for startup founders to share ideas.", avatarUrl: "https://placehold.co/64x64.png?text=SFH" },
  { id: "group3", name: "NextJS Developers", memberCount: 2450, description: "All things NextJS, React, and web development.", avatarUrl: "https://placehold.co/64x64.png?text=NJD" },
];

export async function searchTelegramGroups(query: string): Promise<MockGroup[] | { error: string }> {
  console.log(`Il server sta cercando gruppi Telegram con query: ${query}`);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn("Token Bot Telegram non configurato (TELEGRAM_BOT_TOKEN). Utilizzo di dati mock.");
    if (!query) return [];
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula ritardo di rete
    const lowerCaseQuery = query.toLowerCase();
    return allMockGroupsForFallback.filter(group =>
        group.name.toLowerCase().includes(lowerCaseQuery) ||
        group.description.toLowerCase().includes(lowerCaseQuery)
    );
  }

  // const bot = new Telegraf(botToken); 
  try {
    // Implementazione reale della ricerca API Telegram qui
    console.warn("Chiamata API Telegram reale non implementata in searchTelegramGroups. Si utilizzano dati mock filtrati.");
    if (!query) return [];
    await new Promise(resolve => setTimeout(resolve, 750)); 
    const lowerCaseQuery = query.toLowerCase();
    const filteredGroups = allMockGroupsForFallback.filter(group =>
      group.name.toLowerCase().includes(lowerCaseQuery) ||
      group.description.toLowerCase().includes(lowerCaseQuery)
    );
    return filteredGroups;

  } catch (apiError) {
    console.error("Errore durante la chiamata API a Telegram (simulata):", apiError);
    console.warn("Errore API. Utilizzo di dati mock per la ricerca.");
    if (!query) return [];
    const lowerCaseQuery = query.toLowerCase();
    return allMockGroupsForFallback.filter(group =>
        group.name.toLowerCase().includes(lowerCaseQuery) ||
        group.description.toLowerCase().includes(lowerCaseQuery)
    );
  }
}

export async function joinTelegramGroup(group: MockGroup): Promise<{ success: boolean; message: string }> {
  console.log(`Tentativo di iscrizione al gruppo ${group.name} (ID: ${group.id}) e salvataggio su Firestore.`);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    // Anche se il token non c'è per l'API Telegram, possiamo comunque tentare di salvare su Firestore
    console.warn("Token Bot Telegram non configurato. L'iscrizione a Telegram non verrà effettuata, ma si tenterà il salvataggio su Firestore.");
  }

  // const bot = new Telegraf(botToken);
  // Logica per l'iscrizione reale al gruppo Telegram (attualmente simulata)
  // ...

  try {
    const groupRef = doc(db, "subscribedGroups", group.id);
    await setDoc(groupRef, {
      name: group.name,
      memberCount: group.memberCount,
      description: group.description,
      avatarUrl: group.avatarUrl,
      subscribedAt: Timestamp.now() 
    });
    console.log(`Gruppo ${group.name} salvato su Firestore.`);
    // La simulazione di iscrizione a Telegram e il salvataggio su Firestore sono concettualmente separati
    // ma qui li gestiamo insieme per semplicità.
    return { success: true, message: `Richiesta di iscrizione a "${group.name}" inviata e gruppo salvato.` };
  } catch (error) {
    console.error("Errore durante il salvataggio del gruppo su Firestore:", error);
    return { success: false, message: `Errore durante il salvataggio del gruppo "${group.name}" su Firestore.` };
  }
}

export async function getStoredSubscribedGroupIds(): Promise<string[]> {
  try {
    const groupsCollectionRef = collection(db, "subscribedGroups");
    const querySnapshot = await getDocs(groupsCollectionRef);
    const groupIds = querySnapshot.docs.map(doc => doc.id);
    console.log("Recuperati ID gruppi sottoscritti da Firestore:", groupIds);
    return groupIds;
  } catch (error) {
    console.error("Errore durante il recupero degli ID dei gruppi sottoscritti da Firestore:", error);
    return [];
  }
}

// Funzione di esempio per annullare l'iscrizione (placeholder, da implementare se necessario)
export async function leaveTelegramGroup(groupId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Tentativo di annullare l'iscrizione dal gruppo ID: ${groupId}`);
  try {
    const groupRef = doc(db, "subscribedGroups", groupId);
    const docSnap = await getDoc(groupRef);
    if (docSnap.exists()) {
      await deleteDoc(groupRef);
      console.log(`Gruppo ${groupId} rimosso da Firestore.`);
      return { success: true, message: "Iscrizione annullata e gruppo rimosso." };
    } else {
      return { success: false, message: "Gruppo non trovato tra le iscrizioni."};
    }
  } catch (error) {
    console.error("Errore durante la rimozione del gruppo da Firestore:", error);
    return { success: false, message: "Errore durante l'annullamento dell'iscrizione." };
  }
}
