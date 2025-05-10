import { Component as ChartDemo } from "@/components/ui/ChartDemo";

export default function Page() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Removed the heading since it's now in the navigation */}
      <p className="text-gray-500 mb-4">
        Track your Chess.com rating progression over time
      </p>
      <ChartDemo />
    </div>
  );
}