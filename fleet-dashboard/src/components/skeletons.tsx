"use client";

import { Card, Row, Col, Skeleton } from "antd";

export function KpiCardsSkeleton() {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Col key={i} xs={12} lg={Math.floor(24 / 5)}>
          <Card size="small" style={{ borderColor: "var(--border)" }}>
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: 80 }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function ChartsSkeleton() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={10}>
        <Card size="small" style={{ borderColor: "var(--border)" }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Col>
      <Col xs={24} md={12} xl={7}>
        <Card size="small" style={{ borderColor: "var(--border)" }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Col>
      <Col xs={24} md={12} xl={7}>
        <Card size="small" style={{ borderColor: "var(--border)" }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Col>
    </Row>
  );
}

export function FleetTableSkeleton() {
  return (
    <Card size="small" style={{ borderColor: "var(--border)" }}>
      <Skeleton active paragraph={{ rows: 12 }} />
    </Card>
  );
}
