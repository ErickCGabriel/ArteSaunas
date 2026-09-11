import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Página não encontrada — Arte Saunas" };

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Arte Saunas"
            width={1208}
            height={283}
            priority
            className="h-12 w-auto"
          />
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold">Página não encontrada</h1>
              <p className="text-sm text-muted-foreground">
                O endereço acessado não existe ou foi movido.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/">Ir para o início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
