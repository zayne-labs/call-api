// eslint-disable-next-line import/extensions
import { baseOptions } from "@/app/layout.config";
import { HomeLayout as FumaHomeLayout } from "fumadocs-ui/layouts/home";

function HomeLayout({ children }: { children: React.ReactNode }) {
	return <FumaHomeLayout {...baseOptions}>{children}</FumaHomeLayout>;
}

export default HomeLayout;
