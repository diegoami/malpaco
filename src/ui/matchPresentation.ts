import type {GameMap,GameState} from '../core';
import type {MatchIdentity} from '../core/match-save';
import type {MapHandlers,MapViewState} from './mapView';

/** The renderer and replay origin travel with the explicit save identity. */
export interface MatchPresentation {
 readonly identity:MatchIdentity;
 readonly label:string;
 readonly initialState:GameState;
 readonly createMap:(map:GameMap,handlers:MapHandlers)=>{readonly el:SVGSVGElement;render(view:MapViewState):void};
}
