
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';

const ScheduledPostSchema = z.object({
  messageContent: z.string().min(1).max(4096),
  targetGroups: z.array(z.string()).min(1), // These will be actual Telegram Chat IDs
  scheduledAt: z.date(),
  useOptimalTiming: z.boolean().optional(),
  status: z.enum(['pending', 'sent', 'failed', 'partially_sent']).default('pending'),
  // Optional: Add an array to store send attempts and their results for each target
  sendAttempts: z.array(z.object({
    chatId: z.string(),
    status: z.enum(['success', 'failed']),
    error: z.string().optional(),
    sentAt: z.date().optional(),
  })).optional(),
  processedAt: z.date().optional(), // Timestamp for when the post was last processed by the sending job
});

export type ScheduledPostInput = z.infer<typeof ScheduledPostSchema>;

export interface SubscribedGroupForScheduler {
  id: string; // Firestore document ID (which is the telegramChatId)
  name: string;
  telegramChatId: string;
}

export async function schedulePostAction(data: ScheduledPostInput): Promise<{ success: boolean; message: string; postId?: string }> {
  const validation = ScheduledPostSchema.safeParse({
    ...data,
    status: data.status || 'pending', // Ensure status is set
  });

  if (!validation.success) {
    return { success: false, message: `Errore di validazione: ${validation.error.errors.map(e => e.message).join(', ')}` };
  }

  try {
    const postData = {
      ...validation.data,
      scheduledAt: Timestamp.fromDate(validation.data.scheduledAt),
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'scheduledPosts'), postData);
    console.log('Post pianificato salvato su Firestore con ID:', docRef.id);
    return { success: true, message: 'Post pianificato e salvato con successo!', postId: docRef.id };
  } catch (error: any) {
    console.error('Errore nel salvataggio del post pianificato su Firestore:', error);
    return { success: false, message: `Errore nel server: ${error.message}` };
  }
}

export async function getSubscribedGroupsForScheduler(): Promise<SubscribedGroupForScheduler[]> {
  try {
    const groupsCollectionRef = collection(db, "subscribedGroups");
    const querySnapshot = await getDocs(groupsCollectionRef);
    const groups: SubscribedGroupForScheduler[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      groups.push({
        id: doc.id, // The document ID is the telegramChatId
        name: data.name || `Gruppo ID: ${doc.id}`,
        telegramChatId: data.telegramChatId || doc.id, // Ensure telegramChatId is present
      });
    });
    console.log("Recuperati gruppi sottoscritti per lo scheduler:", groups.length);
    return groups;
  } catch (error) {
    console.error("Errore nel recupero dei gruppi sottoscritti da Firestore per lo scheduler:", error);
    return []; // Restituisce un array vuoto in caso di errore
  }
}

// Phase 2: Function to process and send scheduled posts (placeholder for now)
// This function would be triggered by a cron job (e.g., a Cloud Function)
export async function processScheduledPosts(): Promise<{ success: boolean, message: string, processedCount: number, failedCount: number }> {
  // TODO: Implement logic to:
  // 1. Get Telegram bot instance (see telegram.ts idea)
  // 2. Query Firestore for posts with status 'pending' and scheduledAt <= now
  // 3. For each post, attempt to send messages to targetGroups (which are chat IDs)
  // 4. Update post status in Firestore ('sent', 'failed', 'partially_sent') with details
  console.warn("processScheduledPosts: Funzione non ancora implementata completamente. Questa funzione dovrebbe essere chiamata da un job schedulato (es. Cloud Function).");
  return { success: false, message: "Implementazione invio post non ancora completa.", processedCount: 0, failedCount: 0 };
}
