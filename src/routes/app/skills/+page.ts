import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { type Skill, databases } from '$lib/appwrite';

export const load: PageLoad = async ({ parent, depends }) => {
	depends('skills:all');

	const data = await parent();

	const response = await databases.listDocuments<Skill>('main', 'skills');

	return {
		skills: response.documents
	};
};
