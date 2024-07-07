/* eslint-disable import-x/no-named-as-default */
/* eslint-disable import-x/no-named-as-default-member */
/* eslint-disable import-x/default */
import nextra from "nextra";

// const withNextra = require("nextra")({

// 	theme: "nextra-theme-docs",
// 	themeConfig: "./theme.config.tsx",
// });

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
const withNextra = nextra({
	theme: "nextra-theme-docs",
	themeConfig: "./theme.config.tsx",
});

// module.exports = withNextra();
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default withNextra();
