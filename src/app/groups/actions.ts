
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
  { id: "typescript_telegram", name: "TypeScript Telegram (Example @username)", memberCount: 0, description: "Official Telegram group for TypeScript. (Search with '@typescript_telegram' to test API)", avatarUrl: "https://placehold.co/64x64.png?text=TS" },
];

let bot: Telegraf | null = null;
const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (botToken) {
  bot = new Telegraf(botToken);
  console.log("Telegraf bot initialized with token.");
} else {
  console.warn("TELEGRAM_BOT_TOKEN not found in .env.local. Telegram API calls will be skipped, using mock data or simulations.");
}

export async function searchTelegramGroups(searchQuery: string): Promise<MockGroup[] | { error: string }> {
  console.log(`Server searching for Telegram groups with query: ${searchQuery}`);

  if (!bot || !botToken) {
    console.warn("Telegram bot not initialized or token not available. Falling back to mock search.");
    if (!searchQuery) return [];
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula ritardo di rete
    const lowerCaseQuery = searchQuery.toLowerCase();
    return allMockGroupsForFallback.filter(group =>
        group.name.toLowerCase().includes(lowerCaseQuery) ||
        group.description.toLowerCase().includes(lowerCaseQuery) ||
        group.id.toLowerCase().includes(lowerCaseQuery)
    );
  }

  // Tentativo di ricerca "reale" se la query è un ID o un @username
  if (searchQuery.startsWith("@") || !isNaN(Number(searchQuery))) {
    try {
      console.log(`Attempting to getChat for specific identifier: ${searchQuery}`);
      const chat = await bot.telegram.getChat(searchQuery);
      // @ts-ignore - Telegraf types might not perfectly align with all chat types
      const title = chat.title || 'N/A';
      // @ts-ignore
      const description = chat.description || 'Description not available via direct getChat.';
      let memberCount = 0;
      try {
        memberCount = await bot.telegram.getChatMembersCount(chat.id);
      } catch (mcError) {
        console.warn(`Could not get member count for ${chat.id}:`, mcError);
      }
      
      // TODO: Implement fetching chat photo URL if needed (more complex)
      // const photo = chat.photo ? await bot.telegram.getFileLink(chat.photo.small_file_id) : 'https://placehold.co/64x64.png';

      const groupResult: MockGroup = {
        id: chat.id.toString(),
        name: title,
        memberCount: memberCount,
        description: description,
        avatarUrl: `https://placehold.co/64x64.png?text=${title.substring(0,2).toUpperCase()}` // Placeholder avatar
      };
      return [groupResult];
    } catch (error) {
      console.error(`Error calling getChat for '${searchQuery}':`, error);
      // Non restituire errore all'utente, ma loggalo e usa fallback
      // return { error: `Failed to fetch info for '${searchQuery}' from Telegram. It might be private, non-existent, or the bot lacks permissions. Error: ${error.message}` };
       console.warn(`getChat for '${searchQuery}' failed. Falling back to mock search for this specific query.`);
    }
  }
  
  // Fallback a ricerca mock se la query non è specifica o getChat fallisce
  console.warn("Using mock data for general keyword search as Telegram Bot API does not support broad public group searches by keyword. Filter mock data instead.");
  if (!searchQuery) return [];
  await new Promise(resolve => setTimeout(resolve, 500));
  const lowerCaseQuery = searchQuery.toLowerCase();
  const filteredMock = allMockGroupsForFallback.filter(group =>
    group.name.toLowerCase().includes(lowerCaseQuery) ||
    group.description.toLowerCase().includes(lowerCaseQuery) ||
    group.id.toLowerCase().includes(lowerCaseQuery)
  );
  if (filteredMock.length === 0) {
    return { error: `No mock groups found for "${searchQuery}". Note: Real broad search via Telegram API is not supported. Try searching with a specific @username or group ID for a direct lookup.` };
  }
  return filteredMock;
}

export async function joinTelegramGroup(group: MockGroup): Promise<{ success: boolean; message: string; telegramVerified: boolean }> {
  console.log(`Attempting to 'join' group ${group.name} (ID: ${group.id}) and save to Firestore.`);
  let telegramVerified = false;
  let verificationMessage = "Group details could not be verified with Telegram API (bot might not be a member, group is private, or an API error occurred).";

  if (bot && botToken) {
    try {
      console.log(`Verifying group ${group.id} with Telegram API.`);
      // @ts-ignore
      const chat = await bot.telegram.getChat(group.id); // group.id should be chat_id or @username
      // @ts-ignore
      console.log(`Telegram API verification successful for ${chat.title || group.name}.`);
      // @ts-ignore
      verificationMessage = `Group '${chat.title || group.name}' successfully verified with Telegram.`;
      telegramVerified = true;
    } catch (apiError: any) {
      console.error(`Error verifying group ${group.id} with Telegram:`, apiError.message);
      verificationMessage = `Could not verify group '${group.name}' with Telegram (ID: ${group.id}). It might be private, non-existent, or the bot lacks permissions.`;
    }
  } else {
    console.warn("Telegram bot not initialized. Skipping Telegram API verification.");
    verificationMessage = "Telegram API verification skipped as bot token is not configured.";
  }

  try {
    const groupRef = doc(db, "subscribedGroups", group.id.toString()); // Ensure ID is string for Firestore
    await setDoc(groupRef, {
      name: group.name,
      memberCount: group.memberCount,
      description: group.description,
      avatarUrl: group.avatarUrl,
      telegramChatId: group.id, // Store original ID used for potential Telegram interaction
      subscribedAt: Timestamp.now()
    });
    console.log(`Group ${group.name} saved to Firestore.`);
    return { 
      success: true, 
      message: `Group "${group.name}" saved to Firestore. ${verificationMessage}`,
      telegramVerified 
    };
  } catch (error: any) {
    console.error("Error saving group to Firestore:", error);
    return { 
      success: false, 
      message: `Error saving group "${group.name}" to Firestore: ${error.message}`,
      telegramVerified: false // explicitly false on firestore save error
    };
  }
}

export async function getStoredSubscribedGroupIds(): Promise<string[]> {
  try {
    const groupsCollectionRef = collection(db, "subscribedGroups");
    const querySnapshot = await getDocs(groupsCollectionRef);
    const groupIds = querySnapshot.docs.map(doc => doc.id); // Firestore doc ID is group.id
    console.log("Fetched subscribed group IDs from Firestore:", groupIds);
    return groupIds;
  } catch (error) {
    console.error("Error fetching subscribed group IDs from Firestore:", error);
    return [];
  }
}

export async function leaveTelegramGroup(groupId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Attempting to unsubscribe from group ID: ${groupId} and remove from Firestore.`);
  // Note: Telegram bots are usually removed by admins. This action only removes it from app's management.
  try {
    const groupRef = doc(db, "subscribedGroups", groupId);
    const docSnap = await getDoc(groupRef);
    if (docSnap.exists()) {
      await deleteDoc(groupRef);
      console.log(`Group ${groupId} removed from Firestore.`);
      return { success: true, message: "Unsubscribed and group removed from app management." };
    } else {
      return { success: false, message: "Group not found in subscribed list."};
    }
  } catch (error: any) {
    console.error("Error removing group from Firestore:", error);
    return { success: false, message: `Error unsubscribing: ${error.message}` };
  }
}
