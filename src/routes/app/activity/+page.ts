import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { type Skill, databases, type Activity } from '$lib/appwrite';
import { Query } from 'appwrite';

export const load: PageLoad = async ({ parent, depends }) => {
	depends('skills:all');

	const data = await parent();

	const response = await databases.listDocuments<Activity>('main', 'activity', [
		Query.orderDesc('$id'),
		Query.limit(50)
	]);

	return {
		activities: response.documents
	};
};
