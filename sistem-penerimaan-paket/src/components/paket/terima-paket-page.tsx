"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import type { Santri, Petugas } from "@/types";
import { toast } from "sonner";
import { Camera, PackagePlus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

const paketSchema = z.object({
  santri_id: z.string().min(1, "Pilih santri"),
  pengirim: z.string().min(1, "Nama pengirim wajib diisi"),
  ekspedisi: z.string().min(1, "Ekspedisi wajib diisi"),
  nomor_resi: z.string().optional(),
  catatan: z.string().optional(),
  petugas_menerima: z.string().min(1, "Nama petugas wajib diisi"),
});

type PaketFormData = z.infer<typeof paketSchema>;

export function TerimaPaketPage() {
  const router = useRouter();
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [petugasList, setPetugasList] = useState<Petugas[]>([]);
  const [searchSantri, setSearchSantri] = useState("");
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaketFormData>({
    resolver: zodResolver(paketSchema),
  });

  useEffect(() => {
    fetchSantri();
    fetchPetugas();
  }, []);

  async function fetchSantri() {
    const { data } = await supabase
      .from("santri")
      .select("*")
      .eq("status_aktif", true)
      .order("nama");
    setSantriList(data || []);
  }

  async function fetchPetugas() {
    const { data } = await supabase.from("petugas").select("*").order("nama");
    setPetugasList(data || []);
    if (data && data.length > 0) {
      setValue("petugas_menerima", data[0].nama);
    }
  }

  const filteredSantri = santriList.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchSantri.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchSantri.toLowerCase())
  );

  const handleSelectSantri = (santri: Santri) => {
    setSelectedSantri(santri);
    setValue("santri_id", santri.id);
    setSearchSantri("");
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PaketFormData) => {
    setIsSubmitting(true);
    try {
      let fotoUrl: string | null = null;

      if (fotoFile) {
        const fileExt = fotoFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("paket-foto")
          .upload(fileName, fotoFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const { data: urlData } = supabase.storage.from("paket-foto").getPublicUrl(fileName);
          fotoUrl = urlData.publicUrl;
        }
      }

      const { data: kodeData, error: kodeError } = await supabase.rpc("generate_kode_paket");
      if (kodeError) throw kodeError;

      const { error } = await supabase.from("paket").insert({
        kode_paket: kodeData,
        santri_id: data.santri_id,
        pengirim: data.pengirim,
        ekspedisi: data.ekspedisi,
        nomor_resi: data.nomor_resi || null,
        catatan: data.catatan || null,
        foto_paket: fotoUrl,
        petugas_menerima: data.petugas_menerima,
        status: "Menunggu Diambil",
        tanggal_masuk: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Paket berhasil diterima");
      reset();
      setSelectedSantri(null);
      setFotoPreview(null);
      setFotoFile(null);
      router.push("/paket");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menerima paket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Terima Paket" subtitle="Input data paket yang masuk ke pesantren">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Pilih Santri */}
            <div className="space-y-2">
              <Label>Pilih Santri</Label>
              {selectedSantri ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {selectedSantri.nama.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedSantri.nama}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSantri.nis} - {selectedSantri.kelas} - {selectedSantri.asrama}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedSantri(null);
                      setValue("santri_id", "");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama atau NIS santri..."
                      value={searchSantri}
                      onChange={(e) => setSearchSantri(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {searchSantri && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {filteredSantri.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground text-center">
                          Santri tidak ditemukan
                        </p>
                      ) : (
                        filteredSantri.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectSantri(s)}
                            className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-3 border-b last:border-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {s.nama.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{s.nama}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.nis} - {s.kelas}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <input type="hidden" {...register("santri_id")} />
                  {errors.santri_id && (
                    <p className="text-xs text-destructive">{errors.santri_id.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pengirim">Nama Pengirim</Label>
                <Input id="pengirim" {...register("pengirim")} />
                {errors.pengirim && (
                  <p className="text-xs text-destructive">{errors.pengirim.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ekspedisi">Ekspedisi</Label>
                <Input id="ekspedisi" placeholder="JNE, J&T, SiCepat, dll" {...register("ekspedisi")} />
                {errors.ekspedisi && (
                  <p className="text-xs text-destructive">{errors.ekspedisi.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomor_resi">Nomor Resi (Opsional)</Label>
                <Input id="nomor_resi" {...register("nomor_resi")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="petugas_menerima">Petugas Menerima</Label>
                <select
                  id="petugas_menerima"
                  {...register("petugas_menerima")}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {petugasList.map((p) => (
                    <option key={p.id} value={p.nama}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan (Opsional)</Label>
              <Textarea id="catatan" rows={3} {...register("catatan")} />
            </div>

            {/* Foto Paket */}
            <div className="space-y-2">
              <Label>Foto Paket (Opsional)</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {fotoPreview ? "Ganti Foto" : "Ambil Foto"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFotoChange}
                />
                {fotoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFotoPreview(null);
                      setFotoFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {fotoPreview && (
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-48 h-48 object-cover rounded-lg border"
                />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.push("/paket")}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <PackagePlus className="w-4 h-4 mr-2" />
                {isSubmitting ? "Menyimpan..." : "Simpan Paket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
