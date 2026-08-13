"use client";

import Link from "next/link";
import { MessageCircle, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDatePK, waLink } from "@/lib/utils";
import { feeStatusLabel } from "@/lib/constants";

export function UpcomingDues({
  dues,
}: {
  dues: {
    id: string;
    studentId: string;
    studentName: string;
    month: string;
    balance: number;
    dueDate: Date;
    status: string;
    overdue: boolean;
  }[];
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Upcoming Fee Dues</h3>
          <p className="text-xs text-muted">Overdue and due within 30 days</p>
        </div>
        <Wallet className="h-5 w-5 text-gold" />
      </div>
      {dues.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">
          No outstanding dues. All fees are settled.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-border">
                <th className="table-th">Student</th>
                <th className="table-th">Month</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Due Date</th>
                <th className="table-th">Status</th>
                <th className="table-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {dues.map((d) => {
                const overdue = d.overdue;
                return (
                  <tr key={d.id} className="table-row">
                    <td className="table-td font-semibold text-foreground">
                      {d.studentName}
                      <span className="block text-[11px] font-normal text-muted">
                        {d.studentId}
                      </span>
                    </td>
                    <td className="table-td">{d.month}</td>
                    <td className="table-td font-bold text-foreground">
                      {formatMoney(d.balance)}
                    </td>
                    <td className="table-td">
                      <span className={overdue ? "font-semibold text-danger" : ""}>
                        {formatDatePK(d.dueDate)}
                      </span>
                    </td>
                    <td className="table-td">
                      <Badge tone={d.status === "PENDING" ? "red" : "amber"}>
                        {feeStatusLabel[d.status]}
                      </Badge>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1.5">
                        <Link
                          href={`/students/${d.id}`}
                          className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold transition hover:bg-surface-alt"
                        >
                          View
                        </Link>
                        <a
                          href={waLink(
                            "92",
                            `Dear parent, this is a reminder that the ${d.month} fee of ${formatMoney(d.balance)} for ${d.studentName} at Young Fighters Academy is due. Please clear it by ${formatDatePK(d.dueDate)}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Send WhatsApp reminder"
                          className="rounded-lg border border-success/40 px-2.5 py-1 text-xs font-semibold text-success transition hover:bg-success/10"
                        >
                          <MessageCircle className="mr-1 inline h-3 w-3" />
                          WhatsApp
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}