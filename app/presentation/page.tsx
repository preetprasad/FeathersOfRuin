import type { Metadata } from "next";
import { PresentationMode } from "./presentation-mode";

export const metadata: Metadata = {
  title: "Interactive presentation",
  description: "A guided, interactive explanation of Reid Sentinel's data analysis and decision-support method.",
};

export default function PresentationPage() {
  return <PresentationMode />;
}
