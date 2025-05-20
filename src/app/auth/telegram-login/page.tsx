
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import Link from "next/link";

export default function TelegramLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Accedi con Telegram</CardTitle>
          <CardDescription>
            Collega il tuo account Telegram per continuare.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button className="w-full">
            <Send className="mr-2 h-5 w-5" />
            Connetti Telegram
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Cliccando "Connetti Telegram", verrai reindirizzato a Telegram per autorizzare l'applicazione.
          </p>
          <hr className="my-2"/>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/dashboard">
              Torna alla Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
