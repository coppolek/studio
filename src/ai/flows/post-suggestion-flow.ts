
'use server';
/**
 * @fileOverview Flow per generare suggerimenti per post sui social media.
 *
 * - getPostSuggestion - Una funzione che genera suggerimenti per migliorare un post.
 * - PostSuggestionInput - Il tipo di input per la funzione getPostSuggestion.
 * - PostSuggestionOutput - Il tipo di output per la funzione getPostSuggestion.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PostSuggestionInputSchema = z.object({
  messageContent: z.string().describe('Il contenuto attuale del messaggio del post.'),
  targetAudienceInfo: z.string().describe('Una breve descrizione del target a cui è destinato il post (es. "gruppo di appassionati di tecnologia", "canale di notizie").'),
});
export type PostSuggestionInput = z.infer<typeof PostSuggestionInputSchema>;

const PostSuggestionOutputSchema = z.object({
  suggestion: z.string().describe("Un suggerimento conciso per migliorare il post, includendo potenziali modifiche al testo, tono, o consigli sulla tempistica di pubblicazione. Mantieni il suggerimento entro 2-3 frasi."),
});
export type PostSuggestionOutput = z.infer<typeof PostSuggestionOutputSchema>;

export async function getPostSuggestion(input: PostSuggestionInput): Promise<PostSuggestionOutput> {
  return getPostSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'postSuggestionPrompt',
  input: { schema: PostSuggestionInputSchema },
  output: { schema: PostSuggestionOutputSchema },
  prompt: `Sei un esperto di social media marketing specializzato nell'ottimizzazione di post per Telegram.
Analizza il seguente contenuto del messaggio e le informazioni sul target. Fornisci un suggerimento conciso (massimo 2-3 frasi) per migliorarlo.
Il suggerimento può riguardare:
- Tempistiche di pubblicazione ottimali per quel target.
- Modifiche alla formulazione per aumentare l'engagement.
- Aggiunta di call to action.
- Tono del messaggio.

Contenuto Messaggio:
{{{messageContent}}}

Informazioni Target:
{{{targetAudienceInfo}}}

Fornisci solo il suggerimento come output strutturato.
Esempio di suggerimento: "Per un gruppo tech, prova a postare questo nel tardo pomeriggio. Potresti anche aggiungere una domanda diretta come 'Cosa ne pensate di questa novità?' per stimolare la discussione."
`,
});

const getPostSuggestionFlow = ai.defineFlow(
  {
    name: 'getPostSuggestionFlow',
    inputSchema: PostSuggestionInputSchema,
    outputSchema: PostSuggestionOutputSchema,
  },
  async (input: PostSuggestionInput) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("L'LLM non ha restituito un output valido per il suggerimento del post.");
    }
    return output;
  }
);
