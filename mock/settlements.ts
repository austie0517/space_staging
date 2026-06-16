import type { Settlement } from "@/types";
import { sampleHost } from "./users";

/** Host earnings summary for the 課金 tab. */
export const hostEarnings = {
  monthLabel: "2024年11月",
  projected: 428000,
  confirmed: 312000,
  pendingPayout: 116000,
  payouts: [
    { id: "po-1", date: "2024年10月31日", amount: 286000, status: "支払済" },
    { id: "po-2", date: "2024年9月30日", amount: 254000, status: "支払済" },
  ],
};

export const settlements: Settlement[] = [
  {
    id: "st-1",
    hostName: sampleHost.businessName,
    period: "2024年11月",
    gross: 312000,
    fee: 31200,
    net: 280800,
    status: "pending",
  },
  {
    id: "st-2",
    hostName: sampleHost.businessName,
    period: "2024年10月",
    gross: 318000,
    fee: 31800,
    net: 286200,
    status: "paid",
  },
  {
    id: "st-3",
    hostName: "Greenery Co-work",
    period: "2024年10月",
    gross: 145000,
    fee: 14500,
    net: 130500,
    status: "paid",
  },
];
