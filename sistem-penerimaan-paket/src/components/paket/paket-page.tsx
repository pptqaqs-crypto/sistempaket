"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { Paket } from "@/types";
import {
  Search,
  Plus,
  Eye,
  Trash2,
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

export function PaketPage() {
  const [paketList, setPaketList] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [ekspedisiFilter, setEkspedisiFilter] = useState<string>("");

  const fetchPaket = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("paket")
        .select("*, santri:santri_id(nama, kelas, asrama)", { count: "exact" })
        .order("tanggal_masuk", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (search.trim()) {
        query = query.or(
          `kode_paket.ilike.%${search.trim()}%,pengirim.ilike.%${search.trim()}%,nomor_resi.ilike.%${search.trim()}%`
        );
      }
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }
      if (ekspedisiFilter) {
        query = query.ilike("ekspedisi", `%${ekspedisiFilter}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      setPaketList(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data paket");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, ekspedisiFilter]);

  useEffect(() => {
    fetchPaket();
  }, [fetchPaket]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchPaket();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("paket").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Paket berhasil dihapus");
      setDeleteOpen(false);
      setDeleteId(null);
      fetchPaket();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus paket");
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <AppShell title="Manajemen Paket" subtitle="Kelola semua paket yang masuk">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <Input
              placeholder="Cari kode paket, pengirim, resi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </form>
          <Link href="/terima-paket">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Terima Paket
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">Semua Status</option>
            <option value="Menunggu Diambil">Menunggu Diambil</option>
            <option value="Sudah Diambil">Sudah Diambil</option>
          </select>
          <Input
            placeholder="Filter ekspedisi..."
            value={ekspedisiFilter}
            onChange={(e) => {
              setEkspedisiFilter(e.target.value);
              setPage(0);
            }}
            className="w-40 h-9"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kode Paket</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nama Santri</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kelas</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Asrama</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ekspedisi</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Resi</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tanggal Masuk</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : paketList.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState
                          icon="search"
                          title="Tidak ada data paket"
                          description="Belum ada data paket atau tidak ditemukan hasil pencarian."
                        />
                      </td>
                    </tr>
                  ) : (
                    paketList.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono text-xs">{p.kode_paket}</td>
                        <td className="py-3 px-4 font-medium">{(p.santri as any)?.nama || "-"}</td>
                        <td className="py-3 px-4">{(p.santri as any)?.kelas || "-"}</td>
                        <td className="py-3 px-4">{(p.santri as any)?.asrama || "-"}</td>
                        <td className="py-3 px-4">{p.ekspedisi}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.nomor_resi || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(p.tanggal_masuk)}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={p.status === "Sudah Diambil" ? "default" : "secondary"}
                            className={
                              p.status === "Sudah Diambil"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-300"
                            }
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/paket/${p.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleteId(p.id);
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paket</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.
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
