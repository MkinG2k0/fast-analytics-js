import { ProjectsPage } from "@/page-components/projects";
import { getProjects } from "@/page-components/projects/lib";

export default async function ProjectsPageWrapper() {
  const projects = await getProjects();
  return <ProjectsPage initialProjects={projects} />;
}
