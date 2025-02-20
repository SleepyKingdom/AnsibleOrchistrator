import { Navbar } from "@/components/navbar";
import { JobList } from "@/components/job-list";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
          </CardHeader>
          <JobList />
        </Card>
      </main>
    </div>
  );
}
