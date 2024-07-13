// eslint-disable-next-line import-x/default, import-x/no-named-as-default, import-x/no-named-as-default-member
import nextra from "nextra";

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
const withNextra = nextra({
	theme: "nextra-theme-docs",
	themeConfig: "./theme.config.tsx",
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default withNextra();
