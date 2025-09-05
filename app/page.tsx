import { Component as ChartDemo } from "@/components/ui/ChartDemo";
import { Button } from "@/components/ui/button";
import { DotsSquareIcon } from "@/components/ui/icons";

export default function Page() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Removed the heading since it's now in the navigation */}
      <p className="text-gray-500 mb-4">
        Track your Chess.com rating progression over time
      </p>

      {/* Button Design Showcase */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">New Button Design</h2>
        <div className="flex gap-4 flex-wrap">
          <Button variant="primary-green" size="xl">
            <DotsSquareIcon />
            Primary Action
          </Button>
          <Button variant="primary-green" size="xl">
            <DotsSquareIcon />
            Get Started
          </Button>
          <Button variant="primary-green" size="xl">
            <DotsSquareIcon />
            Play Now
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Updated button design based on Figma specifications
        </p>
      </div>

      <ChartDemo />
    </div>
  );
}
