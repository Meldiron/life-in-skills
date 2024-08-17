import { Client, Account, Databases, type Models } from 'appwrite';

export type Skill = {
	name: string;
	icon: string;
	targetLevel: number;
	xp: number;
} & Models.Document;

const client = new Client();
client.setEndpoint('https://appwrite.life-in-skills.almostapps.eu/v1').setProject('life-in-skills');

export const account = new Account(client);
export const databases = new Databases(client);
