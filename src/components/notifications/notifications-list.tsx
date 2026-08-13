"use client";

import { useState, useTransition } from "react";
import { Bell, Megaphone, CheckCheck, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import {
  markNotificationsReadAction,
  markNotificationReadAction,
  deleteNotificationAction,
  createAnnouncementAction,
} from "@/app/actions/misc";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
};

export function NotificationsList({
  initial,
  announcements,
  role,
}: {
  initial: Notif[];
  announcements: Announcement[];
  role: string;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [notifs, setNotifs] = useState(initial);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", body: "", audience: "ALL" });

  const unread = notifs.filter((n) => !n.read).length;

  const markAll = () => {
    startTransition(async () => {
      await markNotificationsReadAction();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      toast("All notifications marked as read", "success");
    });
  };

  const markOne = (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void markNotificationReadAction(id);
  };

  const removeOne = (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    void deleteNotificationAction(id);
  };

  const publish = () => {
    startTransition(async () => {
      const res = await createAnnouncementAction(annForm);
      if (res.ok) {
        toast("Announcement published", "success");
        setShowAnnounce(false);
        setAnnForm({ title: "", body: "", audience: "ALL" });
        window.location.reload();
      } else {
        toast(res.error, "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {announcements.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
            <Megaphone className="h-4 w-4 text-gold" /> Announcements
          </h2>
          {announcements.map((a) => (
            <div key={a.id} className="rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{a.title}</p>
                <span className="shrink-0 text-xs text-muted">{formatDate(a.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{a.body}</p>
            </div>
          ))}
        </section>
      )}

      {role === "ADMIN" && (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4">
          <div>
            <p className="flex items-center gap-2 font-bold">
              <Megaphone className="h-4 w-4 text-gold" /> Publish announcement
            </p>
            <p className="text-xs text-muted">
              Announcements appear in every user&apos;s notification feed and portal.
            </p>
          </div>
          <Button onClick={() => setShowAnnounce(true)}>
            <Plus className="h-4 w-4" /> New Announcement
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Bell className="h-5 w-5 text-primary" /> Notifications
          {unread > 0 && <Badge tone="red">{unread} unread</Badge>}
        </h2>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAll} loading={pending}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="No notifications"
            description="You&apos;re all caught up."
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {notifs.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border bg-card px-4 py-3",
                n.read ? "border-border" : "border-primary/30 bg-primary/5"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm", n.read ? "font-medium text-muted" : "font-bold")}>
                    {n.title}
                  </p>
                  <span className="text-xs text-muted">{formatDate(n.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted">{n.body}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {!n.read && (
                  <button
                    onClick={() => markOne(n.id)}
                    title="Mark read"
                    className="rounded-lg p-2 text-muted transition hover:bg-surface-alt hover:text-foreground"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => removeOne(n.id)}
                  title="Delete"
                  className="rounded-lg p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={showAnnounce}
        onClose={() => setShowAnnounce(false)}
        title="New Announcement"
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Title *</span>
            <input
              className="input"
              value={annForm.title}
              onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
              placeholder="e.g. Practice rescheduled"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Message *</span>
            <textarea
              className="input min-h-24"
              value={annForm.body}
              onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })}
              placeholder="Details of the announcement…"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Audience</span>
            <select
              className="input"
              value={annForm.audience}
              onChange={(e) => setAnnForm({ ...annForm, audience: e.target.value })}
            >
              <option value="ALL">Everyone</option>
              <option value="ADMIN">Admins</option>
              <option value="COACH">Coaches</option>
              <option value="STUDENT">Students</option>
              <option value="PARENT">Parents</option>
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAnnounce(false)}>
              Cancel
            </Button>
            <Button onClick={publish} loading={pending} disabled={!annForm.title || !annForm.body}>
              Publish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}