"use client";

import { Card, Row, Col, Typography } from "antd";
import { PnlBarChart } from "./pnl-bar-chart";
import { PnlTrendChart } from "./pnl-trend-chart";
import { SohDistributionChart } from "./soh-distribution-chart";
import { DepreciationCurveChart } from "./depreciation-curve-chart";
import { DepotComparisonChart } from "./depot-comparison-chart";

const { Text } = Typography;

function ChartCard({ title, sub, children, stretch }: { title: string; sub: string; children: React.ReactNode; stretch?: boolean }) {
  return (
    <Card size="small" style={{ borderColor: "var(--border)", background: "var(--bg3)", height: stretch ? "100%" : undefined }} styles={{ body: { padding: "18px", height: stretch ? "100%" : undefined, display: stretch ? "flex" : undefined, flexDirection: stretch ? "column" : undefined } }}>
      <div style={{ marginBottom: 14 }}>
        <Text strong style={{ fontSize: 13, color: "var(--text)", display: "block" }}>{title}</Text>
        <Text style={{ fontSize: 11, color: "var(--text3)" }}>{sub}</Text>
      </div>
      <div style={{ flex: stretch ? 1 : undefined }}>{children}</div>
    </Card>
  );
}

export function ChartsSection() {
  return (
    <div className="flex flex-col gap-4">
      <Row gutter={[14, 14]}>
        <Col xs={24} xl={10}>
          <ChartCard stretch title="P&L Breakdown" sub="Monthly revenue, cost + depreciation, and net P&L">
            <PnlBarChart />
          </ChartCard>
        </Col>
        <Col xs={24} md={12} xl={7}>
          <ChartCard stretch title="SOH Distribution" sub="Bus count by battery health band">
            <SohDistributionChart />
          </ChartCard>
        </Col>
        <Col xs={24} md={12} xl={7}>
          <ChartCard stretch title="Depreciation Curve" sub="Asset value erosion from 100%→70% SOH">
            <DepreciationCurveChart />
          </ChartCard>
        </Col>
      </Row>
      <Row gutter={[14, 14]}>
        <Col xs={24} lg={12}>
          <ChartCard title="Cumulative P&L Trend" sub="Running total of net P&L vs cumulative revenue and cost">
            <PnlTrendChart />
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard title="Revenue vs Cost by Depot" sub="Click a depot to filter the dashboard">
            <DepotComparisonChart />
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
}
