"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export function QrScanner() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const el = document.getElementById("qr-reader") as HTMLDivElement;
    if (!el) return;

    const scanner = new Html5Qrcode("qr-reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (handledRef.current || !mounted) return;
          handledRef.current = true;
          setScanning(false);
          const url = new URL(decodedText, window.location.origin);
          if (url.pathname.startsWith("/scan/")) {
            router.push(url.pathname);
          } else {
            setError("Not a valid YFA student QR code");
            handledRef.current = false;
            setScanning(true);
            void scanner.resume();
          }
        },
        () => {}
      )
      .catch(() => {
        if (!mounted) return;
        setError("Could not start camera. Allow camera access or scan the code with your phone.");
        setScanning(false);
      });

    return () => {
      mounted = false;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s && s.isScanning) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [router]);

  const stop = () => {
    const s = scannerRef.current;
    if (s && s.isScanning) {
      s.stop()
        .then(() => s.clear())
        .catch(() => {});
    }
    setScanning(false);
  };

  return (
    <div>
      <PageHeader
        title="Scan QR Code"
        description="Point the camera at a student's ID card to mark attendance."
      />
      <div className="mx-auto max-w-lg">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-black">
          {scanning ? (
            <div id="qr-reader" className="min-h-72 [&_video]:object-cover" />
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 bg-navy text-white">
              <Camera className="h-8 w-8 text-gold" />
              <p className="text-sm text-white/60">Camera stopped</p>
              <Button
                variant="outline"
                onClick={() => {
                  setError("");
                  router.refresh();
                }}
              >
                Restart
              </Button>
            </div>
          )}
          {scanning && (
            <button
              onClick={stop}
              aria-label="Stop camera"
              className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {error && (
          <p className="mt-3 flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <ScanLine className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}
        <p className="mt-4 text-center text-xs text-muted">
          You can also just scan the QR with any phone camera — it opens a mark-attendance page.
        </p>
      </div>
    </div>
  );
}