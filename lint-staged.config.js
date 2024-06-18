export default {
	"*.{js,ts}": ["pnpm format", "pnpm lint"],
	"*.ts": () => "pnpm check-types -p tsconfig.json",
	"*.{json,yaml}": ["prettier --write"],
};
