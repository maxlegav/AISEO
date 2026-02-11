import ProjectCard from "./ProjectCard";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageContext";

interface Project {
  _id: string;
  name: string;
  slug: string;
  primaryUrl: string;
  category: string;
}

interface ProjectListProps {
  projects: Project[];
  username: string;
}

export default function ProjectList({ projects, username }: ProjectListProps) {
  const { t } = useLanguage();

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
          <Plus className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {String(t("dashboard.noProjects"))}
        </h3>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {String(t("project.emptyStateDesc"))}
        </p>
        <Link href="/projects/create">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {String(t("dashboard.createProject"))}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project._id}
          name={project.name}
          slug={project.slug}
          primaryUrl={project.primaryUrl}
          category={project.category}
          username={username}
        />
      ))}
    </div>
  );
}
