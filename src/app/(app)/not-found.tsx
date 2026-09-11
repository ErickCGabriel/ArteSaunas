import type { Metadata } from "next";
import Link from "next/link";
import { CompassIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Página não encontrada — Arte Saunas" };

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CompassIcon className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">Página não encontrada</h1>
            <p className="text-sm text-muted-foreground">
              O que você procura pode ter sido removido ou o link está incorreto.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/">Voltar ao painel</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
