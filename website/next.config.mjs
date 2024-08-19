// eslint-disable-next-line import-x/default, import-x/no-named-as-default, import-x/no-named-as-default-member
import nextra from "nextra";

const withNextra = nextra({
	theme: "nextra-theme-docs",
	themeConfig: "./theme.config.tsx",
});

export default withNextra();
