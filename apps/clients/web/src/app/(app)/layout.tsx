import { ProjectAppShell } from "@/components/cut/project-app-shell";

export default function AppSegmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProjectAppShell>{children}</ProjectAppShell>;
}
