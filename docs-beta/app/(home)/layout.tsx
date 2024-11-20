/* eslint-disable import/extensions */
import { baseOptions } from "@/app/layout.config";
import { HomeLayout as FumaHomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from "react";

function HomeLayout({ children }: { children: ReactNode }): React.ReactElement {
	return <FumaHomeLayout {...baseOptions}>{children}</FumaHomeLayout>;
}

export default HomeLayout;
