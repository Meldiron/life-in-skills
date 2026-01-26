import { Client, Account, Databases, type Models, Functions } from 'appwrite';

export type AccountPrefs = {
	dailyBonus: number;
	isPublic: boolean;
	publicPath: string;
	publicNickname: string;
	highlightDaily: boolean;
	presets: string; // array<{ amount, effortName, note }>
} & Models.Preferences;

export type Skill = {
	name: string;
	icon: string;
	targetLevel: number;
	reward: string;
	xp: number;
	lastActivityAt: string;
	position: number;
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
	note: string;
	icon: string;
} & Models.Document;

export type PublicProfile = {
	userId: string;
} & Models.Document;

export type InventoryItem = {
	name: string;
	count: number;
	icon: string;
	userId: string;
} & Models.Document;

const client = new Client();
client.setEndpoint('https://appwrite.life-in-skills.almostapps.eu/v1').setProject('life-in-skills');

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
