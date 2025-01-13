import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }: any) => {
	const data = await parent();

	if (!data.user) {
		redirect(307, '/');
	}
};
