import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, PlayCircle } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/">
              <a className="text-xl font-bold text-primary">Ansible Manager</a>
            </Link>
            <div className="hidden md:flex items-center space-x-4 ml-10">
              <Link href="/playbooks">
                <a className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-accent">
                  <FileText className="h-4 w-4 mr-2" />
                  Playbooks
                </a>
              </Link>
              <Link href="/jobs">
                <a className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-accent">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Jobs
                </a>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.username}
            </span>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              className="text-sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
