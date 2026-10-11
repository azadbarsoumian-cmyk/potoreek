import React, { useState } from "react";
import { submitForm } from "@/lib/forms";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PreorderDialog({ open, onOpenChange, productTitle }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(false);
    try {
      await submitForm("preorder", { email, product_title: productTitle });
      setDone(true);
    } catch {
      setError(true);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setDone(false); setError(false); setEmail(""); } }}>
      <DialogContent className="bg-[#F4F1EC] border-black/10">
        <DialogHeader>
          <DialogTitle className="font-heading">{productTitle}</DialogTitle>
        </DialogHeader>
        {done ? (
          <p className="text-sm text-black/70 py-4">Thank you — we'll email you when this title is ready to ship.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <p className="text-sm text-black/60">This title hasn't shipped yet. Leave your email and we'll notify you when it's available.</p>
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white"
            />
            <Button type="submit" disabled={submitting} className="w-full bg-[#C1272D] hover:bg-[#a11f24]">
              {submitting ? "Sending..." : "Notify me"}
            </Button>
            {error && <p className="text-sm text-[#C1272D]">Something went wrong. Please try again.</p>}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}