"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import type { Santri } from "@/types";
import { toast } from "sonner";

const santriSchema = z.object({
  nis: z.string().min(1, "NIS wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  kelas: z.string().min(1, "Kelas wajib diisi"),
  asrama: z.string().min(1, "Asrama wajib diisi"),
  no_hp_wali: z.string().optional(),
  status_aktif: z.boolean(),
});

type SantriFormData = z.infer<typeof santriSchema>;

interface SantriFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  santri: Santri | null;
  onSuccess: () => void;
}

export function SantriFormDialog({ open, onOpenChange, santri, onSuccess }: SantriFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SantriFormData>({
    resolver: zodResolver(santriSchema),
  });

  const statusAktif = watch("status_aktif");

  useEffect(() => {
    if (santri) {
      reset({
        nis: santri.nis,
        nama: santri.nama,
        kelas: santri.kelas,
        asrama: santri.asrama,
        no_hp_wali: santri.no_hp_wali || "",
        status_aktif: santri.status_aktif,
      });
    } else {
      reset({
        nis: "",
        nama: "",
        kelas: "",
        asrama: "",
        no_hp_wali: "",
        status_aktif: true,
      });
    }
  }, [santri, reset]);

  const onSubmit = async (data: SantriFormData) => {
    try {
      if (santri) {
        const { error } = await supabase.from("santri").update(data).eq("id", santri.id);
        if (error) throw error;
        toast.success("Santri berhasil diperbarui");
      } else {
        const { error } = await supabase.from("santri").insert(data);
        if (error) throw error;
        toast.success("Santri berhasil ditambahkan");
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan data santri");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{santri ? "Edit Santri" : "Tambah Santri"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nis">NIS</Label>
            <Input id="nis" {...register("nis")} />
            {errors.nis && <p className="text-xs text-destructive">{errors.nis.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input id="nama" {...register("nama")} />
            {errors.nama && <p className="text-xs text-destructive">{errors.nama.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Input id="kelas" {...register("kelas")} />
              {errors.kelas && <p className="text-xs text-destructive">{errors.kelas.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="asrama">Asrama/Kamar</Label>
              <Input id="asrama" {...register("asrama")} />
              {errors.asrama && <p className="text-xs text-destructive">{errors.asrama.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="no_hp_wali">Nomor HP Wali</Label>
            <Input id="no_hp_wali" {...register("no_hp_wali")} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="status_aktif"
              checked={statusAktif}
              onCheckedChange={(checked) => setValue("status_aktif", checked as boolean)}
            />
            <Label htmlFor="status_aktif" className="cursor-pointer">
              Santri Aktif
            </Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : santri ? "Simpan Perubahan" : "Tambah Santri"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
