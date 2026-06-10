"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/lib/supabase";
import { formatNumber } from "@/lib/utils";
import type { DashboardStats, PaketHarian, PaketBulanan, PaketTerlama } from "@/types";
import {
  Package,
  PackageCheck,
  PackageOpen,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [harian, setHarian] = useState<PaketHarian[]>([]);
  const [bulanan, setBulanan] = useState<PaketBulanan[]>([]);
  const [terlama, setTerlama] = useState<PaketTerlama[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const { data: statsData } = await supabase.rpc("get_dashboard_stats").single();
      if (statsData) setStats(statsData as unknown as DashboardStats);

      const { data: harianData } = await supabase.rpc("get_paket_harian");
      if (harianData) setHarian(harianData as unknown as PaketHarian[]);

      const { data: bulananData } = await supabase.rpc("get_paket_bulanan");
      if (bulananData) setBulanan(bulananData as unknown as PaketBulanan[]);

      const { data: terlamaData } = await supabase.rpc("get_paket_terlama_belum_diambil", {
        limit_count: 5,
      });
      if (terlamaData) setTerlama(terlamaData as unknown as PaketTerlama[]);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: "Paket Masuk Hari Ini",
      value: stats?.total_hari_ini ?? 0,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Belum Diambil",
      value: stats?.belum_diambil ?? 0,
      icon: PackageOpen,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "Sudah Diambil",
      value: stats?.sudah_diambil ?? 0,
      icon: PackageCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      title: "Total Bulan Ini",
      value: stats?.total_bulan_ini ?? 0,
      icon: CalendarDays,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950",
    },
  ];

  return (
    <AppShell title="Dashboard" subtitle="Ringkasan penerimaan paket pesantren">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    {loading ? (
                      <Skeleton className="h-8 w-20 mt-2" />
                    ) : (
                      <p className="text-3xl font-bold mt-1">{formatNumber(card.value)}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${card.bg}`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4" />
                Paket Harian (30 Hari Terakhir)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : harian.length === 0 ? (
                <EmptyState title="Belum ada data" description="Data paket harian belum tersedia." />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={harian}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tanggal" tickFormatter={(v) => new Date(v).getDate().toString()} />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [formatNumber(value as number), "Paket"]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString("id-ID")}
                    />
                    <Bar dataKey="total" fill="#15803d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4" />
                Paket Bulanan (12 Bulan Terakhir)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : bulanan.length === 0 ? (
                <EmptyState title="Belum ada data" description="Data paket bulanan belum tersedia." />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={bulanan}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bulan" tickFormatter={(v) => v.slice(5)} />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [formatNumber(value as number), "Paket"]}
                      labelFormatter={(label) => label}
                    />
                    <Line type="monotone" dataKey="total" stroke="#15803d" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Paket Terlama */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Paket Terlama Belum Diambil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : terlama.length === 0 ? (
              <EmptyState title="Tidak ada paket tertunda" description="Semua paket sudah diambil." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Kode Paket</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Nama Santri</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Kelas</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Asrama</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Ekspedisi</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Tertunda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terlama.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-3 font-mono text-xs">{p.kode_paket}</td>
                        <td className="py-2 px-3">{p.nama_santri}</td>
                        <td className="py-2 px-3">{p.kelas}</td>
                        <td className="py-2 px-3">{p.asrama}</td>
                        <td className="py-2 px-3">{p.ekspedisi}</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Clock className="w-3 h-3" />
                            {p.hari_tertunda} hari
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
