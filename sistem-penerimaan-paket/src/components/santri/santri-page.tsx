"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { SantriFormDialog } from "./santri-form-dialog";
import { supabase } from "@/lib/supabase";
import type { Santri } from "@/types";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 10;

export function SantriPage() {
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSantri = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("santri")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (search.trim()) {
        query = query.or(`nis.ilike.%${search.trim()}%,nama.ilike.%${search.trim()}%,kelas.ilike.%${search.trim()}%,asrama.ilike.%${search.trim()}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      setSantriList(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data santri");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchSantri();
  }, [fetchSantri]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchSantri();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("santri").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Santri berhasil dihapus");
      setDeleteOpen(false);
      setDeleteId(null);
      fetchSantri();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus santri. Pastikan tidak ada paket terkait.");
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["NIS", "Nama", "Kelas", "Asrama", "No HP Wali", "Status"],
      ...santriList.map((s) => [
        s.nis,
        s.nama,
        s.kelas,
        s.asrama,
        s.no_hp_wali || "",
        s.status_aktif ? "Aktif" : "Nonaktif",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data-santri-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data berhasil diekspor");
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <AppShell title="Data Santri" subtitle="Kelola data santri pesantren">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <Input
              placeholder="Cari NIS, nama, kelas, asrama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => {
                setSelectedSantri(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Santri
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">NIS</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nama</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kelas</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Asrama</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">No HP Wali</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : santriList.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon="search"
                          title="Tidak ada data santri"
                          description="Belum ada data santri atau tidak ditemukan hasil pencarian."
                        />
                      </td>
                    </tr>
                  ) : (
                    santriList.map((s) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono text-xs">{s.nis}</td>
                        <td className="py-3 px-4 font-medium">{s.nama}</td>
                        <td className="py-3 px-4">{s.kelas}</td>
                        <td className="py-3 px-4">{s.asrama}</td>
                        <td className="py-3 px-4 text-muted-foreground">{s.no_hp_wali || "-"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              s.status_aktif
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {s.status_aktif ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSantri(s);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleteId(s.id);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Halaman {page + 1} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SantriFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        santri={selectedSantri}
        onSuccess={fetchSantri}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Santri</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus santri ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
