import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, depends }) => {
	const data = await parent();

	return {};
};
