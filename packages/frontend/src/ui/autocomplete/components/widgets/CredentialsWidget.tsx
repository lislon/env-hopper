import React from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Copy, KeyRound } from "lucide-react";

interface Credential {
  slug: string;
  desc: string;
  user: string;
  pwd: string;
}

interface CredentialsWidgetProps {
  credentials?: Credential[];
}

const defaultCredentials: Credential[] = [
  { slug: "SC", desc: "San‑Carlos", user: "test@natera.com", pwd: "testuser" },
  { slug: "AU", desc: "Austin", user: "austin@natera.com", pwd: "Z*cT" },
];

export function CredentialsWidget({ 
  credentials = defaultCredentials 
}: CredentialsWidgetProps) {
  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <Card className="h-32">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Credentials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 px-3 pb-3">
        {credentials.map((cred) => (
          <div key={cred.slug} className="flex items-center justify-between text-xs">
            <Badge variant="secondary" className="mr-1 px-1.5 py-0.5">
              {cred.slug}
            </Badge>
            <span className="truncate flex-1" title={cred.desc}>
              {cred.desc}
            </span>
            <Button variant="ghost" size="icon" onClick={() => copy(cred.user)}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => copy(cred.pwd)}>
              <KeyRound className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 