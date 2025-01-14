import type { PageLoad } from './$types';
import { serverDatabases, serverUsers } from '$lib/appwrite.server';
import { type PublicProfile, type Combat, type AccountPrefs, type Skill } from '$lib/appwrite';
import { Query } from 'appwrite';
import { ID, Permission, Role } from 'node-appwrite';

export const load: PageLoad = async ({ params }: any) => {
	const path = params.path;

	const publicProfile = await serverDatabases.getDocument<PublicProfile>(
		'main',
		'publicProfiles',
		path
	);

	const { userId } = publicProfile;

	const user = await serverUsers.get<AccountPrefs>(userId);

	let combat: null | Combat = null;

	try {
		combat = await serverDatabases.getDocument<Combat>('main', 'combat', userId);
	} catch (err) {
		combat = await serverDatabases.createDocument<Combat>(
			'main',
			'combat',
			userId,
			{
				deaths: 0
			},
			[
				Permission.read(Role.user(userId)),
				Permission.delete(Role.user(userId)),
				Permission.update(Role.user(userId))
			]
		);
	}

	const skillsResponse = await serverDatabases.listDocuments<Skill>('main', 'skills', [
		Query.equal('userId', userId)
	]);

	const skills = skillsResponse.documents;

	return {
		name: user.prefs?.publicNickname ?? 'Hero',
		path,
		skills,
		combat
	};
};
