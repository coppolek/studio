
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const ScheduledPostSchema = z.object({
  messageContent: z.string().min(1).max(4096),
  targetGroups: z.array(z.string()).min(1),
  scheduledAt: z.date(),
  useOptimalTiming: z.boolean().optional(),
  // Potresti voler aggiungere un userId in futuro se hai l'autenticazione
  // userId: z.string().optional(), 
  status: z.enum(['pending', 'sent', 'failed']).default('pending'),
});

export type ScheduledPostInput = z.infer<typeof ScheduledPostSchema>;

export async function schedulePostAction(data: ScheduledPostInput): Promise<{ success: boolean; message: string; postId?: string }> {
  const validation = ScheduledPostSchema.safeParse(data);

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
