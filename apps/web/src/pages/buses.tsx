import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApiList } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { Bus } from "@bus/shared";

export function BusesPage() {
  const { data: buses, refresh } = useApiList<Bus>("/buses");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [form, setForm] = useState({ registrationNumber: "", type: "regular", capacity: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      registrationNumber: form.registrationNumber,
      type: form.type as any,
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
    };

    if (editing) {
      await api.put(`/buses/${editing.id}`, body);
    } else {
      await api.post("/buses", body);
    }

    setOpen(false);
    setEditing(null);
    setForm({ registrationNumber: "", type: "regular", capacity: "" });
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bus?")) return;
    await api.delete(`/buses/${id}`);
    refresh();
  };

  const openEdit = (bus: Bus) => {
    setEditing(bus);
    setForm({
      registrationNumber: bus.registrationNumber,
      type: bus.type,
      capacity: bus.capacity?.toString() || "",
    });
    setOpen(true);
  };

  const statusColor = (s: string) => {
    if (s === "active") return "default";
    if (s === "maintenance") return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Buses</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({ registrationNumber: "", type: "regular", capacity: "" })}>
              <Plus className="mr-2 h-4 w-4" /> Add Bus
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Bus" : "Add Bus"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="regular">Regular</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="ac">AC</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">{editing ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Registration</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buses.map((bus) => (
            <TableRow key={bus.id}>
              <TableCell className="font-medium">{bus.registrationNumber}</TableCell>
              <TableCell className="capitalize">{bus.type}</TableCell>
              <TableCell>{bus.capacity || "-"}</TableCell>
              <TableCell>
                <Badge variant={statusColor(bus.status)}>{bus.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(bus)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(bus.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
