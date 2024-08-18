import { Client, Account, Databases, type Models } from 'appwrite';

export type Skill = {
	name: string;
	icon: string;
	targetLevel: number;
	xp: number;
} & Models.Document;

export type Combat = {
	hp: number;
	deaths: number;
} & Models.Document;

export type CombatAction = {
	name: string;
	type: 'craving' | 'potion';
	power: number;
} & Models.Document;

export type Activity = {
	text: string;
} & Models.Document;

const client = new Client();
client.setEndpoint('https://appwrite.life-in-skills.almostapps.eu/v1').setProject('life-in-skills');

export const account = new Account(client);
export const databases = new Databases(client);
