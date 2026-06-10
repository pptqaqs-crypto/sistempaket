"use client";

import { Package, SearchX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "package" | "search";
}

export function EmptyState({
  title = "Tidak ada data",
  description = "Belum ada data yang tersedia.",
  icon = "package",
}: EmptyStateProps) {
  const Icon = icon === "search" ? SearchX : Package;
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
    </div>
  );
}
