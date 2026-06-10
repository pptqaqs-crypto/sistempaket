"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Paket, Santri } from "@/types";
import {
  ArrowLeft,
  Printer,
  PackageCheck,
  Trash2,
  User,
  Truck,
  Clock,
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

interface PaketDetailPageProps {
  id: string;
}

export function PaketDetailPage({ id }: PaketDetailPageProps) {
  const router = useRouter();
  const [paket, setPaket] = useState<Paket | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [ambilOpen, setAmbilOpen] = useState(false);
  const [petugasAmbil, setPetugasAmbil] = useState("");

  const fetchPaket = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("paket")
        .select("*, santri:santri_id(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      setPaket(data as unknown as Paket);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat detail paket");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPaket();
  }, [fetchPaket]);

  const handleAmbil = async () => {
    if (!paket) return;
    try {
      const { error } = await supabase
        .from("paket")
        .update({
          status: "Sudah Diambil",
          tanggal_diambil: new Date().toISOString(),
          petugas_mengambil: petugasAmbil || paket.petugas_menerima,
        })
        .eq("id", paket.id);
      if (error) throw error;
      toast.success("Paket berhasil ditandai sudah diambil");
      setAmbilOpen(false);
      fetchPaket();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate status paket");
    }
  };

  const handleDelete = async () => {
    if (!paket) return;
    try {
      const { error } = await supabase.from("paket").delete().eq("id", paket.id);
      if (error) throw error;
      toast.success("Paket berhasil dihapus");
      router.push("/paket");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus paket");
    }
  };

  const handlePrintLabel = () => {
    window.print();
  };

  const santri = paket?.santri as Santri | undefined;

  if (loading) {
    return (
      <AppShell title="Detail Paket">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!paket) {
    return (
      <AppShell title="Detail Paket">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Paket tidak ditemukan</p>
          <Link href="/paket">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Detail Paket - ${paket.kode_paket}`}>
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-wrap gap-2 no-print">
          <Link href="/paket">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrintLabel}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak Label
          </Button>
          {paket.status === "Menunggu Diambil" && (
            <Button size="sm" onClick={() => setAmbilOpen(true)}>
              <PackageCheck className="w-4 h-4 mr-2" />
              Tandai Sudah Diambil
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Card */}
          <Card className="print-only">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    typeof window !== "undefined" ? window.location.href : ""
                  )}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="mt-4 font-mono text-sm text-muted-foreground">{paket.kode_paket}</p>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Data Santri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Nama</p>
                    <p className="font-medium">{santri?.nama || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">NIS</p>
                    <p className="font-medium">{santri?.nis || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Kelas</p>
                    <p className="font-medium">{santri?.kelas || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Asrama</p>
                    <p className="font-medium">{santri?.asrama || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Data Paket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Kode Paket</p>
                    <p className="font-mono font-medium">{paket.kode_paket}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant={paket.status === "Sudah Diambil" ? "default" : "secondary"}
                      className={
                        paket.status === "Sudah Diambil"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                      }
                    >
                      {paket.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pengirim</p>
                    <p className="font-medium">{paket.pengirim}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ekspedisi</p>
                    <p className="font-medium">{paket.ekspedisi}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor Resi</p>
                    <p className="font-medium">{paket.nomor_resi || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Catatan</p>
                    <p className="font-medium">{paket.catatan || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Riwayat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal Masuk</p>
                    <p className="font-medium">{formatDateTime(paket.tanggal_masuk)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Petugas Menerima</p>
                    <p className="font-medium">{paket.petugas_menerima}</p>
                  </div>
                  {paket.tanggal_diambil && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground">Tanggal Diambil</p>
                        <p className="font-medium">{formatDateTime(paket.tanggal_diambil)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Petugas Mengambil</p>
                        <p className="font-medium">{paket.petugas_mengambil}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {paket.foto_paket && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Foto Paket</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={paket.foto_paket}
                    alt="Foto Paket"
                    className="max-w-md rounded-lg border"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Ambil Paket */}
      <AlertDialog open={ambilOpen} onOpenChange={setAmbilOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai Sudah Diambil</AlertDialogTitle>
            <AlertDialogDescription>
              Konfirmasi bahwa paket ini sudah diambil oleh santri.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleAmbil}>Ya, Sudah Diambil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Hapus */}
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
