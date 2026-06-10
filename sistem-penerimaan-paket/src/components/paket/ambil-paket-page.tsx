"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { Paket, Santri } from "@/types";
import {
  Search,
  PackageCheck,
  QrCode,
  Eye,
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

export function AmbilPaketPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaket, setSelectedPaket] = useState<Paket | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [petugasList, setPetugasList] = useState<{ id: string; nama: string }[]>([]);
  const [petugasAmbil, setPetugasAmbil] = useState("");

  useEffect(() => {
    fetchPetugas();
  }, []);

  async function fetchPetugas() {
    const { data } = await supabase.from("petugas").select("id, nama").order("nama");
    setPetugasList(data || []);
    if (data && data.length > 0) setPetugasAmbil(data[0].nama);
  }

  const handleSearch = useCallback(async () => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const trimmed = search.trim();

      const { data, error } = await supabase
        .from("paket")
        .select("*, santri:santri_id(nama, nis, kelas, asrama)")
        .eq("status", "Menunggu Diambil")
        .or(
          `kode_paket.ilike.%${trimmed}%,nomor_resi.ilike.%${trimmed}%`
        );

      if (error) throw error;

      let allResults = [...(data || [])];

      const { data: santriData } = await supabase
        .from("santri")
        .select("id")
        .or(`nama.ilike.%${trimmed}%,nis.ilike.%${trimmed}%`);

      if (santriData && santriData.length > 0) {
        const santriIds = santriData.map((s) => s.id);
        const { data: paketBySantri } = await supabase
          .from("paket")
          .select("*, santri:santri_id(nama, nis, kelas, asrama)")
          .eq("status", "Menunggu Diambil")
          .in("santri_id", santriIds);

        if (paketBySantri) {
          const existingIds = new Set(allResults.map((p) => p.id));
          paketBySantri.forEach((p) => {
            if (!existingIds.has(p.id)) allResults.push(p as unknown as Paket);
          });
        }
      }

      setResults(allResults);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mencari paket");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search.trim()) handleSearch();
      else setResults([]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, handleSearch]);

  const handleAmbil = async () => {
    if (!selectedPaket) return;
    try {
      const { error } = await supabase
        .from("paket")
        .update({
          status: "Sudah Diambil",
          tanggal_diambil: new Date().toISOString(),
          petugas_mengambil: petugasAmbil,
        })
        .eq("id", selectedPaket.id);
      if (error) throw error;
      toast.success(`Paket ${selectedPaket.kode_paket} berhasil ditandai sudah diambil`);
      setConfirmOpen(false);
      setSelectedPaket(null);
      setResults((prev) => prev.filter((p) => p.id !== selectedPaket.id));
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate status paket");
    }
  };

  return (
    <AppShell title="Ambil Paket" subtitle="Cari dan tandai paket yang sudah diambil santri">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Cari dengan kode paket, NIS, nama santri, atau nomor resi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 text-base"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Masukkan kode paket, NIS santri, nama santri, atau scan QR code
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-16 bg-muted/50 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results.length === 0 && search.trim() ? (
          <EmptyState
            icon="search"
            title="Paket tidak ditemukan"
            description="Tidak ada paket yang menunggu diambil dengan kata kunci tersebut."
          />
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((paket) => {
              const santri = paket.santri as unknown as Santri;
              return (
                <Card key={paket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <QrCode className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-medium">{paket.kode_paket}</p>
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                            >
                              Menunggu
                            </Badge>
                          </div>
                          <p className="font-medium mt-0.5">{santri?.nama || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {santri?.kelas} - {santri?.asrama} - {paket.ekspedisi}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Masuk: {formatDate(paket.tanggal_masuk)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/paket/${paket.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Detail
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPaket(paket);
                            setConfirmOpen(true);
                          }}
                        >
                          <PackageCheck className="w-4 h-4 mr-1" />
                          Sudah Diambil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai Sudah Diambil</AlertDialogTitle>
            <AlertDialogDescription>
              Konfirmasi bahwa paket {selectedPaket?.kode_paket} milik {(selectedPaket?.santri as unknown as Santri)?.nama || ""} sudah diambil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleAmbil}>Ya, Sudah Diambil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
