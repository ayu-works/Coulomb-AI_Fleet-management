"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Row, Col } from "antd";
import { DashboardProvider } from "@/lib/dashboard-context";
import { TopNav } from "@/components/top-nav";
import { KpiCards } from "@/components/kpi-cards";
import { SectionDivider } from "@/components/section-divider";
import { TopAttention } from "@/components/top-attention";
import { StarPerformers } from "@/components/star-performers";
import { ComparisonWidget } from "@/components/comparison-widget";
import { BusDetailPanel } from "@/components/bus-detail-panel";
import {
  KpiCardsSkeleton,
  ChartsSkeleton,
  FleetTableSkeleton,
} from "@/components/skeletons";

const ChartsSection = dynamic(
  () => import("@/components/charts/charts-section").then((m) => m.ChartsSection),
  { loading: () => <ChartsSkeleton />, ssr: false }
);

const FleetTable = dynamic(
  () => import("@/components/fleet-table").then((m) => m.FleetTable),
  { loading: () => <FleetTableSkeleton />, ssr: false }
);

export default function Home() {
  return (
    <DashboardProvider>
      <TopNav />
      <main className="flex flex-1 flex-col gap-5 px-6 py-5" style={{ maxWidth: 1440, margin: "0 auto", width: "100%" }}>
        <Suspense fallback={<KpiCardsSkeleton />}>
          <KpiCards />
        </Suspense>
        <SectionDivider title="PERFORMANCE TRENDS" />
        <ChartsSection />
        <SectionDivider title="FLEET INTELLIGENCE" />
        <Row gutter={[14, 14]}>
          <Col xs={24} md={8}>
            <TopAttention />
          </Col>
          <Col xs={24} md={8}>
            <StarPerformers />
          </Col>
          <Col xs={24} md={8}>
            <ComparisonWidget />
          </Col>
        </Row>
        <SectionDivider title="ALL BUSES" />
        <FleetTable />
      </main>
      <BusDetailPanel />
    </DashboardProvider>
  );
}
