"use client";

import { useState } from "react";
import { Collapse, Tag, Space, Typography } from "antd";
import {
  WarningOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useDashboard } from "@/lib/dashboard-context";
import type { Alert } from "@/lib/types";

const { Text } = Typography;

function AlertRow({ alert }: { alert: Alert }) {
  const isHigh = alert.severity === "high";
  return (
    <div
      className="flex items-start gap-3 rounded-lg px-3 py-2"
      style={{
        background: isHigh ? "rgba(224,85,85,0.08)" : "rgba(240,168,50,0.08)",
        border: `1px solid ${isHigh ? "rgba(224,85,85,0.2)" : "rgba(250,173,20,0.2)"}`,
      }}
    >
      {isHigh ? (
        <WarningOutlined style={{ color: "#e05555", marginTop: 3 }} />
      ) : (
        <ExclamationCircleOutlined
          style={{ color: "#f0a832", marginTop: 3 }}
        />
      )}
      <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <Text strong style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}>
          {alert.busId}
        </Text>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {alert.message}
        </Text>
      </div>
      <Tag
        color={isHigh ? "error" : "warning"}
        style={{ fontSize: 10, textTransform: "uppercase", margin: 0 }}
      >
        {alert.severity}
      </Tag>
    </div>
  );
}

export function AlertsBanner() {
  const { alerts } = useDashboard();

  if (alerts.length === 0) return null;

  const top10 = alerts.slice(0, 10);
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;

  return (
    <Collapse
      defaultActiveKey={["alerts"]}
      ghost
      style={{ background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)" }}
      items={[
        {
          key: "alerts",
          label: (
            <Space>
              <WarningOutlined style={{ color: "#f0a832" }} />
              <Text strong style={{ fontSize: 13 }}>Fleet Alerts</Text>
              {highCount > 0 && (
                <Tag color="error" style={{ fontSize: 10 }}>
                  {highCount} High
                </Tag>
              )}
              {mediumCount > 0 && (
                <Tag color="warning" style={{ fontSize: 10 }}>
                  {mediumCount} Medium
                </Tag>
              )}
            </Space>
          ),
          children: (
            <div className="flex flex-col gap-2">
              {top10.map((alert, i) => (
                <AlertRow
                  key={`${alert.busId}-${alert.type}-${i}`}
                  alert={alert}
                />
              ))}
              {alerts.length > 10 && (
                <Text
                  type="secondary"
                  style={{ textAlign: "center", fontSize: 12, paddingTop: 4 }}
                >
                  + {alerts.length - 10} more alerts across fleet
                </Text>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
