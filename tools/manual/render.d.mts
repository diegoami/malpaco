import type {Plugin} from 'vite';
export function manualPlugin():Plugin;
export function manualHtml():string;
export function manualFiles():{name:string;content:string|Buffer}[];
