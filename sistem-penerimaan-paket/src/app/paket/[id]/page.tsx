"use client";

import { useParams } from "next/navigation";
import { PaketDetailPage } from "@/components/paket/paket-detail-page";

export default function PaketDetailRoute() {
  const params = useParams();
  const id = params.id as string;
  return <PaketDetailPage id={id} />;
}
