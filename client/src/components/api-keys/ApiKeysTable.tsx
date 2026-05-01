import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { revokeApiKey } from "@/lib/api";
import type { ApiKeyResponse } from "@/types";

function maskKey(key: string): string {
  if (!key) return "-";
  const prefix = key.startsWith("jw_") ? "jw_" : "";
  return prefix + "•".repeat(8);
}

export default function ApiKeysTable({
  keys,
  onRevoked,
}: {
  keys: ApiKeyResponse[];
  onRevoked: () => void;
}) {
  const [revoking, setRevoking] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const handleRevoke = async (id: number) => {
    setRevoking(id);
    try {
      await revokeApiKey(id);
      onRevoked();
    } finally {
      setRevoking(null);
      setConfirmId(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No API keys yet
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="font-mono text-sm">{maskKey(key.rawKey)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => setConfirmId(key.id)}>
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone. Any services using this key will lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={revoking === confirmId}
              onClick={() => confirmId && handleRevoke(confirmId)}
            >
              {revoking === confirmId ? "Revoking..." : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
