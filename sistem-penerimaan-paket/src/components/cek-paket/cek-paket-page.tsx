"use client";

import { useState } from "react";
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
  Package,
  User,
  Calendar,
  Truck,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function CekPaketPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const trimmed = search.trim();

      const { data: paketData, error } = await supabase
        .from("paket")
        .select("*, santri:santri_id(nama, nis, kelas, asrama)")
        .or(`kode_paket.ilike.%${trimmed}%,nomor_resi.ilike.%${trimmed}%`);

      if (error) throw error;

      let allResults = [...(paketData || [])];

      const { data: santriByNis } = await supabase
        .from("santri")
        .select("id")
        .ilike("nis", `%${trimmed}%`);

      if (santriByNis && santriByNis.length > 0) {
        const santriIds = santriByNis.map((s) => s.id);
        const { data: paketBySantri } = await supabase
          .from("paket")
          .select("*, santri:santri_id(nama, nis, kelas, asrama)")
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
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Cek Paket</h1>
              <p className="text-xs text-muted-foreground">Pesantren</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ke Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Masukkan NIS atau Kode Paket..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-11 h-12 text-base"
                  />
                </div>
                <Button onClick={handleSearch} className="w-full" disabled={loading}>
                  {loading ? "Mencari..." : "Cek Paket"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {searched && results.length === 0 && !loading && (
            <EmptyState
              icon="search"
              title="Paket tidak ditemukan"
              description="Pastikan NIS atau kode paket yang dimasukkan sudah benar."
            />
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ditemukan {results.length} paket
              </p>
              {results.map((paket) => {
                const santri = paket.santri as unknown as Santri;
                return (
                  <Card key={paket.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            <span className="font-mono font-medium">{paket.kode_paket}</span>
                          </div>
                          <Badge
                            className={
                              paket.status === "Sudah Diambil"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                            }
                          >
                            {paket.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Nama Santri</p>
                              <p className="font-medium">{santri?.nama || "-"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Tanggal Masuk</p>
                              <p className="font-medium">{formatDate(paket.tanggal_masuk)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Ekspedisi</p>
                              <p className="font-medium">{paket.ekspedisi}</p>
                            </div>
                          </div>
                          {paket.tanggal_diambil && (
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">Tanggal Diambil</p>
                                <p className="font-medium">{formatDate(paket.tanggal_diambil)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
