"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Paket } from "@/types";
import {
  Download,
  Package,
  PackageCheck,
  PackageOpen,
} from "lucide-react";
import { toast } from "sonner";

type FilterType = "harian" | "mingguan" | "bulanan" | "tahunan";

export function LaporanPage() {
  const [filter, setFilter] = useState<FilterType>("bulanan");
  const [paketList, setPaketList] = useState<Paket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLaporan();
  }, [filter]);

  async function fetchLaporan() {
    setLoading(true);
    try {
      let startDate: Date;
      const endDate = new Date();

      switch (filter) {
        case "harian":
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case "mingguan":
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "bulanan":
          startDate = new Date();
          startDate.setDate(1);
          break;
        case "tahunan":
          startDate = new Date();
          startDate.setMonth(0, 1);
          break;
      }

      const { data, error } = await supabase
        .from("paket")
        .select("*, santri:santri_id(nama, kelas, asrama)")
        .gte("tanggal_masuk", startDate!.toISOString())
        .lte("tanggal_masuk", endDate.toISOString())
        .order("tanggal_masuk", { ascending: false });

      if (error) throw error;
      setPaketList(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }

  const totalMasuk = paketList.length;
  const totalDiambil = paketList.filter((p) => p.status === "Sudah Diambil").length;
  const totalBelumDiambil = paketList.filter((p) => p.status === "Menunggu Diambil").length;

  const handleExportCSV = () => {
    const csvContent = [
      [
        "Kode Paket",
        "Nama Santri",
        "Kelas",
        "Asrama",
        "Pengirim",
        "Ekspedisi",
        "Nomor Resi",
        "Tanggal Masuk",
        "Tanggal Diambil",
        "Status",
        "Petugas Menerima",
        "Petugas Mengambil",
      ],
      ...paketList.map((p) => [
        p.kode_paket,
        (p.santri as any)?.nama || "",
        (p.santri as any)?.kelas || "",
        (p.santri as any)?.asrama || "",
        p.pengirim,
        p.ekspedisi,
        p.nomor_resi || "",
        formatDate(p.tanggal_masuk),
        formatDate(p.tanggal_diambil),
        p.status,
        p.petugas_menerima,
        p.petugas_mengambil || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-paket-${filter}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan berhasil diekspor");
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "harian", label: "Harian" },
    { value: "mingguan", label: "Mingguan" },
    { value: "bulanan", label: "Bulanan" },
    { value: "tahunan", label: "Tahunan" },
  ];

  return (
    <AppShell title="Laporan" subtitle="Lihat dan ekspor laporan penerimaan paket">
      <div className="space-y-6">
        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="ml-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Masuk</p>
                  <p className="text-3xl font-bold">{formatNumber(totalMasuk)}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sudah Diambil</p>
                  <p className="text-3xl font-bold">{formatNumber(totalDiambil)}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                  <PackageCheck className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Belum Diambil</p>
                  <p className="text-3xl font-bold">{formatNumber(totalBelumDiambil)}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950">
                  <PackageOpen className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detail Paket</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kode</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Santri</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kelas</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Asrama</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ekspedisi</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tanggal Masuk</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="py-3 px-4">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : paketList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        Tidak ada data untuk periode ini
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
                        <td className="py-3 px-4">{formatDate(p.tanggal_masuk)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline<think> px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.status === "Sudah Diambil"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
