import { Component as ChartDemo } from "@/components/ui/ChartDemo";

export default function Page() {
  return (
    <div className="container mx-auto py-1 px-4">
      <h1 className="text-2xl font-bold mb-0">Chess Rating History</h1>
      <p className="text-gray-500 mb-2">
        Track your Chess.com rating progression over time
      </p>
      <ChartDemo />
    </div>
  );
}