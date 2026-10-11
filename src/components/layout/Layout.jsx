import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { LanguageProvider } from "@/lib/LanguageContext";

export default function Layout() {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-[#F4F1EC]">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}