import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { fetchApiKeys } from "@/lib/api";
import type { ApiKeyResponse } from "@/types";
import ApiKeysTable from "@/components/api-keys/ApiKeysTable";
import CreateApiKeyDialog from "@/components/api-keys/CreateApiKeyDialog";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyResponse[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchApiKeys().then(setKeys).catch(console.error);
  }, []);

  const loadKeys = useCallback(async () => {
    const data = await fetchApiKeys();
    setKeys(data);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <Button onClick={() => setDialogOpen(true)}>Create API Key</Button>
      </div>
      {!keys ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <ApiKeysTable keys={keys} onRevoked={loadKeys} />
      )}
      <CreateApiKeyDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={loadKeys} />
    </div>
  );
}
