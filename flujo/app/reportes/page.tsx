"use client";

import { Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { RevenueChart, AccumulatedChart, CategoryChart, BarRevenueChart } from "@/components/dashboard/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ReportesPage() {
  return (
    <>
      <PageHeader
        title="Reportes" breadcrumb="Reportes"
        description="Análisis comercial, financiero y de clientes."
        actions={<Button variant="secondary" size="sm"><Download className="h-4 w-4" /> Exportar PDF</Button>}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart />
        <AccumulatedChart />
        <Card>
          <CardHeader><CardTitle>Resultado neto mensual</CardTitle></CardHeader>
          <CardContent><BarRevenueChart /></CardContent>
        </Card>
        <CategoryChart />
      </div>
    </>
  );
}
