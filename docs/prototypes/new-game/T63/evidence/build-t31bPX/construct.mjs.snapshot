import {readFileSync} from 'node:fs';
import {selectedPath} from './audit.mjs';
import {html,svg} from './render.mjs';
export function construct(){const bytes=readFileSync(selectedPath),board=JSON.parse(bytes);return {'board.json':bytes,'map.svg':svg(board),'preview.html':html(board)};}
