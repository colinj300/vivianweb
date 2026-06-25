"use client";

import { useEffect } from "react";
import { site } from "@/lib/config";

// Loads the Tawk.to live-chat widget (a floating chat bubble) if a widget
// src has been set in lib/config.js. Does nothing if it's blank, so the
// site works fine before chat is connected.
export default function ChatWidget() {
  useEffect(() => {
    const src = site.chat?.tawkSrc;
    if (!src) return;
    if (document.getElementById("tawk-script")) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const s = document.createElement("script");
    s.id = "tawk-script";
    s.async = true;
    s.src = src;
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    document.body.appendChild(s);
  }, []);

  return null;
}
