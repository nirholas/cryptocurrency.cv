/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AIChatInterface } from "@/components/AIChatInterface";

export default function AskPage() {
  return (
    <>
      <Header />
      <main className="container-main py-8">
        <AIChatInterface />
      </main>
      <Footer />
    </>
  );
}
