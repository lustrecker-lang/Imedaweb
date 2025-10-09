

'use client';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Mountain, LayoutDashboard, Home, Building, Pencil, Database, Mail, School, Briefcase, GraduationCap, Newspaper, DatabaseZap, Tag, Library, Star, BrainCircuit, Presentation, FolderKanban, BriefcaseBusiness, Construction, Landmark, Handshake, Download, Wrench } from "lucide-react";
import { UserNav } from './_components/user-nav';
import { useUser, useFirestore, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { doc } from 'firebase/firestore';
import Image from "next/image";

interface CompanyProfile {
  name?: string;
  iconUrl?: string;
  logoLightUrl?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const companyProfileRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'companyProfile', 'main');
  }, [firestore]);

  const { data: companyProfile } = useDoc<CompanyProfile>(companyProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-[36px] items-center px-2">
            <span className="text-lg font-semibold tracking-wider font-headline">Welcome</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem asChild>
              <Link href="/admin/dashboard">
                <SidebarMenuButton tooltip="Dashboard">
                  <LayoutDashboard />
                  <span className="text-sm">Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <Link href="/admin/company">
                <SidebarMenuButton tooltip="Company">
                  <Building />
                  <span className="text-sm">Company</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <Link href="/admin/campus">
                <SidebarMenuButton tooltip="Campus">
                  <School />
                  <span className="text-sm">Campus</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <Link href="/admin/courses">
                <SidebarMenuButton tooltip="Courses">
                  <GraduationCap />
                  <span className="text-sm">Courses</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem asChild>
              <Link href="/admin/publications">
                <SidebarMenuButton tooltip="Publications">
                  <Library />
                  <span className="text-sm">Publications</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <Link href="/admin/news">
                <SidebarMenuButton tooltip="News">
                  <Newspaper />
                  <span className="text-sm">News</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <Link href="/admin/topics">
                <SidebarMenuButton tooltip="Topics">
                  <Tag />
                  <span className="text-sm">Topics</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem asChild>
              <Link href="/admin/references">
                <SidebarMenuButton tooltip="References">
                  <Star />
                  <span className="text-sm">References</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <Link href="/admin/services">
                <SidebarMenuButton tooltip="Services">
                  <Wrench />
                  <span className="text-sm">Services</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem asChild>
              <Link href="/admin/leads">
                <SidebarMenuButton tooltip="Leads">
                  <Mail />
                  <span className="text-sm">Leads</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <UserNav />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
