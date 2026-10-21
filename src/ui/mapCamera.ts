// Presentation-only map camera: zoom, pan, Fit, Focus and the 0°/90° fit.
// The camera never touches game state; country hits keep working through the
// SVG's own transform, so a hit is always the drawn country under the pointer.

export type Rotation = 0 | 90;
export interface Rect {x: number; y: number; width: number; height: number}
export interface Insets {top: number; right: number; bottom: number; left: number}
export interface Viewport {width: number; height: number; insets: Insets}
/** World-space centre, zoom relative to Fit (1 = Fit) and the board's quarter turn. */
export interface CameraState {x: number; y: number; zoom: number; rotation: Rotation}

// [designed] Searched: the findings cover no camera (the original board never zooms).
export const MAX_ZOOM = 8;
/** A quarter turn must enlarge the fitted board by at least this factor. */
export const ROTATION_GAIN = 1.1;
/** Focus frames the country to fill about this share of the free area, at least 2x. */
export const FOCUS_FILL = 0.4;
export const FOCUS_MIN_ZOOM = 2;
/** Pointer travel in CSS px beyond which a press is a gesture, never a tap. */
export const TAP_SLOP = 10;
export const NO_INSETS: Insets = {top: 0, right: 0, bottom: 0, left: 0};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The free area: the viewport minus insets, never smaller than one pixel. */
export function freeRect(viewport: Viewport): Rect {
  const {insets: i} = viewport;
  return {x: i.left, y: i.top, width: Math.max(1, viewport.width - i.left - i.right), height: Math.max(1, viewport.height - i.top - i.bottom)};
}

/** SVG `rotate(90)`: world (x, y) is drawn at view (-y, x). */
export function toView([x, y]: readonly [number, number], rotation: Rotation): [number, number] {
  return rotation === 90 ? [-y, x] : [x, y];
}
export function toWorld([x, y]: readonly [number, number], rotation: Rotation): [number, number] {
  return rotation === 90 ? [y, -x] : [x, y];
}
export function viewBounds(world: Rect, rotation: Rotation): Rect {
  return rotation === 90 ? {x: -(world.y + world.height), y: world.x, width: world.height, height: world.width} : {...world};
}

/** CSS px per world unit at Fit. */
export function fitScale(world: Rect, viewport: Viewport, rotation: Rotation): number {
  const free = freeRect(viewport), b = viewBounds(world, rotation);
  return Math.min(free.width / b.width, free.height / b.height);
}

/** Turn the board only when the quarter turn clearly uses the space better. */
export function chooseRotation(world: Rect, viewport: Viewport): Rotation {
  return fitScale(world, viewport, 90) >= fitScale(world, viewport, 0) * ROTATION_GAIN ? 90 : 0;
}

/** Keep the free area on the board; at Fit the board stays centred. */
export function clampCamera(state: CameraState, world: Rect, viewport: Viewport): CameraState {
  const zoom = clamp(state.zoom, 1, MAX_ZOOM), s = fitScale(world, viewport, state.rotation) * zoom;
  const free = freeRect(viewport), b = viewBounds(world, state.rotation);
  const [vx, vy] = toView([state.x, state.y], state.rotation);
  const axis = (v: number, start: number, size: number, half: number) =>
    half * 2 >= size ? start + size / 2 : clamp(v, start + half, start + size - half);
  const [x, y] = toWorld([axis(vx, b.x, b.width, free.width / s / 2), axis(vy, b.y, b.height, free.height / s / 2)], state.rotation);
  return {x, y, zoom, rotation: state.rotation};
}

export function fitCamera(world: Rect, viewport: Viewport, rotation = chooseRotation(world, viewport)): CameraState {
  return {x: world.x + world.width / 2, y: world.y + world.height / 2, zoom: 1, rotation};
}

/** The SVG viewBox, in view coordinates, that draws the camera across the whole viewport. */
export function cameraViewBox(state: CameraState, world: Rect, viewport: Viewport): Rect {
  const s = fitScale(world, viewport, state.rotation) * state.zoom, free = freeRect(viewport);
  const [vx, vy] = toView([state.x, state.y], state.rotation);
  return {x: vx - (free.x + free.width / 2) / s, y: vy - (free.y + free.height / 2) / s, width: viewport.width / s, height: viewport.height / s};
}

/** World point drawn at viewport pixel (px, py). */
export function screenToWorld(px: number, py: number, state: CameraState, world: Rect, viewport: Viewport): [number, number] {
  const box = cameraViewBox(state, world, viewport), s = viewport.width / box.width;
  return toWorld([box.x + px / s, box.y + py / s], state.rotation);
}

/** Zoom by `factor`, keeping the world point under (px, py) in place. */
export function zoomAt(state: CameraState, factor: number, px: number, py: number, world: Rect, viewport: Viewport): CameraState {
  const anchor = toView(screenToWorld(px, py, state, world, viewport), state.rotation);
  const zoom = clamp(state.zoom * factor, 1, MAX_ZOOM), s = fitScale(world, viewport, state.rotation) * zoom, free = freeRect(viewport);
  const centre = toWorld([anchor[0] - (px - free.x - free.width / 2) / s, anchor[1] - (py - free.y - free.height / 2) / s], state.rotation);
  return clampCamera({x: centre[0], y: centre[1], zoom, rotation: state.rotation}, world, viewport);
}

/** Move the drawing by (dx, dy) CSS px, as a finger drags it. */
export function panBy(state: CameraState, dx: number, dy: number, world: Rect, viewport: Viewport): CameraState {
  const s = fitScale(world, viewport, state.rotation) * state.zoom;
  const [vx, vy] = toView([state.x, state.y], state.rotation);
  const [x, y] = toWorld([vx - dx / s, vy - dy / s], state.rotation);
  return clampCamera({...state, x, y}, world, viewport);
}

/** Frame one country: centred, large enough to read and pick. */
export function focusCamera(state: CameraState, target: Rect, world: Rect, viewport: Viewport): CameraState {
  const free = freeRect(viewport), t = viewBounds(target, state.rotation), fit = fitScale(world, viewport, state.rotation);
  const zoom = clamp(FOCUS_FILL * Math.min(free.width / t.width, free.height / t.height) / fit, FOCUS_MIN_ZOOM, MAX_ZOOM);
  return clampCamera({x: target.x + target.width / 2, y: target.y + target.height / 2, zoom, rotation: state.rotation}, world, viewport);
}

/** Pan the least distance that brings `target` into the free area (no zoom change). */
export function revealCamera(state: CameraState, target: Rect, world: Rect, viewport: Viewport): CameraState {
  const s = fitScale(world, viewport, state.rotation) * state.zoom, free = freeRect(viewport), t = viewBounds(target, state.rotation);
  const [vx, vy] = toView([state.x, state.y], state.rotation);
  const axis = (c: number, half: number, start: number, size: number) =>
    size >= half * 2 ? start + size / 2 : clamp(c, start + size - half, start + half);
  const [x, y] = toWorld([axis(vx, free.width / s / 2, t.x, t.width), axis(vy, free.height / s / 2, t.y, t.height)], state.rotation);
  return clampCamera({...state, x, y}, world, viewport);
}

/** Keep world-space centre and zoom across a resize; the quarter turn is chosen afresh. */
export function resizeCamera(state: CameraState, world: Rect, viewport: Viewport): CameraState {
  return clampCamera({...state, rotation: chooseRotation(world, viewport)}, world, viewport);
}

/** Inset that removes an overlay rectangle from the free area with the least loss. */
export function obstructionInsets(overlays: readonly Rect[], viewport: {width: number; height: number}): Insets {
  const out = {...NO_INSETS};
  for (const r of overlays) {
    if (r.width <= 0 || r.height <= 0 || r.x >= viewport.width || r.y >= viewport.height || r.x + r.width <= 0 || r.y + r.height <= 0) continue;
    const options: [keyof Insets, number, number][] = [
      ['left', r.x + r.width, (r.x + r.width) * viewport.height], ['right', viewport.width - r.x, (viewport.width - r.x) * viewport.height],
      ['top', r.y + r.height, (r.y + r.height) * viewport.width], ['bottom', viewport.height - r.y, (viewport.height - r.y) * viewport.width],
    ];
    const [edge, amount] = options.reduce((best, next) => next[2] < best[2] ? next : best);
    out[edge] = Math.max(out[edge], amount);
  }
  return out;
}

const SVG = 'http://www.w3.org/2000/svg';
const glyphs: Record<string, string> = {
  in: 'M12 5v14M5 12h14', out: 'M5 12h14',
  fit: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  focus: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
};

/** Binds the camera to one rendered map SVG and its overlay controls. */
export class MapCamera {
  readonly controls: HTMLElement;
  private readonly content: SVGGElement;
  private viewport: Viewport = {width: 0, height: 0, insets: NO_INSETS};
  private current: CameraState;
  private readonly overlays = new Set<Element>();
  private readonly observer: ResizeObserver | null;
  private readonly pointers = new Map<number, {x: number; y: number}>();
  private gesture: {startX: number; startY: number; moved: boolean; pinch: {distance: number; zoom: number} | null} | null = null;
  private suppressClick = false;
  private lastFocused: SVGGraphicsElement | null = null;
  private appliedRotation: Rotation | null = null;
  /** The centre the player asked for (a focused country), kept across clamps so a resize can return to it. */
  private intent: {x: number; y: number} | null = null;

  constructor(readonly svg: SVGSVGElement, readonly world: Rect, private readonly onChange?: (state: CameraState) => void) {
    this.content = document.createElementNS(SVG, 'g') as SVGGElement;
    this.content.setAttribute('class', 'map-camera-content');
    this.content.append(...[...svg.childNodes].filter(node => !(node instanceof Element && node.tagName.toLowerCase() === 'style')));
    svg.append(this.content);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.touchAction = 'none';
    this.current = fitCamera(world, {width: world.width, height: world.height, insets: NO_INSETS}, 0);
    this.controls = document.createElement('div');
    this.controls.className = 'map-camera-controls';
    this.controls.setAttribute('role', 'toolbar');
    this.controls.setAttribute('aria-label', 'Map view');
    const button = (id: string, label: string, glyph: string, run: () => void) => {
      const b = document.createElement('button');
      b.type = 'button'; b.id = id; b.className = 'map-camera-button'; b.setAttribute('aria-label', label); b.title = label;
      const icon = document.createElementNS(SVG, 'svg');
      icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS(SVG, 'path'); path.setAttribute('d', glyphs[glyph]!);
      icon.append(path); b.append(icon); b.onclick = run;
      return b;
    };
    const centre = () => {const f = freeRect(this.viewport); return [f.x + f.width / 2, f.y + f.height / 2] as const;};
    // Fit always rests on the map; Focus appears with a selection and the zoom pair once zoomed (T92).
    this.controls.append(
      button('map-fit', 'Fit whole map', 'fit', () => this.fit()),
      button('map-focus', 'Focus selected country', 'focus', () => this.focusSelected()),
      button('map-zoom-out', 'Zoom out', 'out', () => this.zoomBy(1 / 1.5, ...centre())),
      button('map-zoom-in', 'Zoom in', 'in', () => this.zoomBy(1.5, ...centre())),
    );
    svg.addEventListener('pointerdown', this.onPointerDown);
    svg.addEventListener('pointermove', this.onPointerMove);
    svg.addEventListener('pointerup', this.onPointerUp);
    svg.addEventListener('pointercancel', this.onPointerUp);
    svg.addEventListener('click', this.onClickCapture, true);
    svg.addEventListener('wheel', this.onWheel, {passive: false});
    svg.addEventListener('keydown', this.onKeyDown);
    svg.addEventListener('focusin', this.onFocusIn);
    this.observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.measure());
    this.observer?.observe(svg);
    // The controls float over the board: fit the map beside them so no country hit is covered.
    this.avoid(this.controls);
  }

  get state(): CameraState {return {...this.current};}

  /** Fit into the free area left by these overlays whenever they cover the map. */
  avoid(element: Element | null): void {
    if (!element || this.overlays.has(element)) return;
    this.overlays.add(element);
    this.observer?.observe(element);
    this.measure();
  }

  fit(): void {this.set(fitCamera(this.world, this.viewport));}
  zoomBy(factor: number, px: number, py: number): void {this.set(zoomAt(this.current, factor, px, py, this.world, this.viewport));}

  /** Focus the selected country, else the last country that had keyboard focus. */
  focusSelected(): void {
    const target = this.svg.querySelector<SVGGraphicsElement>('[data-country][data-selected="true"]') ?? this.lastFocused;
    if (!target?.isConnected) return;
    const box = this.bounds(target);
    this.set(focusCamera(this.current, box, this.world, this.viewport), {x: box.x + box.width / 2, y: box.y + box.height / 2});
  }

  /** Shows only the camera controls that can act now; a hidden control hands its focus to Fit. */
  refreshControls(): void {
    const show = {'map-zoom-in': this.current.zoom > 1, 'map-zoom-out': this.current.zoom > 1,
      'map-focus': !!this.svg.querySelector('[data-country][data-selected="true"]')} as Record<string, boolean>;
    for (const [id, visible] of Object.entries(show)) {
      const b = this.controls.querySelector<HTMLButtonElement>(`#${id}`);
      if (!b || b.hidden === !visible) continue;
      const focused = !visible && document.activeElement === b;
      b.hidden = !visible;
      if (focused) this.controls.querySelector<HTMLButtonElement>('#map-fit')?.focus({preventScroll: true});
    }
  }

  /** Restore a camera kept across a re-render; the quarter turn follows the viewport. */
  restore(state: CameraState): void {this.set(resizeCamera(state, this.world, this.viewport));}

  dispose(): void {this.observer?.disconnect(); this.overlays.clear();}

  private bounds(country: SVGGraphicsElement): Rect {
    const box = (country.querySelector<SVGGraphicsElement>('.cell') ?? country).getBBox();
    return {x: box.x, y: box.y, width: Math.max(1, box.width), height: Math.max(1, box.height)};
  }

  private measure(): void {
    const box = this.svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const overlays = [...this.overlays].filter(e => e.isConnected && e.getClientRects().length).map(e => {
      const r = e.getBoundingClientRect();
      return {x: r.left - box.left, y: r.top - box.top, width: r.width, height: r.height};
    });
    this.viewport = {width: box.width, height: box.height, insets: obstructionInsets(overlays, box)};
    this.set(resizeCamera({...this.current, ...this.intent}, this.world, this.viewport), this.intent);
  }

  private set(next: CameraState, intent: {x: number; y: number} | null = null): void {
    this.current = next;
    this.intent = intent;
    if (this.viewport.width && this.viewport.height) {
      const box = cameraViewBox(next, this.world, this.viewport);
      this.svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
    }
    if (this.appliedRotation !== next.rotation) this.applyRotation(next.rotation);
    Object.assign(this.svg.dataset, {cameraZoom: String(next.zoom), cameraRotation: String(next.rotation)});
    this.refreshControls();
    this.onChange?.(this.state);
  }

  /** Turn the board, then turn every label back so counts and names read upright. */
  private applyRotation(rotation: Rotation): void {
    this.appliedRotation = rotation;
    if (rotation) this.content.setAttribute('transform', `rotate(${rotation})`); else this.content.removeAttribute('transform');
    const upright = (el: Element, x: number, y: number) =>
      rotation ? el.setAttribute('transform', `rotate(${-rotation} ${x} ${y})`) : el.removeAttribute('transform');
    for (const label of this.content.querySelectorAll('.country-label')) {
      const count = label.querySelector('.count');
      upright(label, Number(count?.getAttribute('x') ?? 0), Number(count?.getAttribute('y') ?? 0));
    }
    for (const text of this.content.querySelectorAll('text'))
      if (!text.closest('.country-label')) upright(text, Number(text.getAttribute('x') ?? 0), Number(text.getAttribute('y') ?? 0));
  }

  private local(e: PointerEvent | WheelEvent): [number, number] {
    const box = this.svg.getBoundingClientRect();
    return [e.clientX - box.left, e.clientY - box.top];
  }

  private readonly onPointerDown = (e: PointerEvent) => {
    this.suppressClick = false;
    // A primary pointer starts a fresh gesture, even if an earlier release was never delivered.
    if (e.isPrimary) {this.pointers.clear(); this.gesture = null;}
    this.pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (this.pointers.size === 1) this.gesture = {startX: e.clientX, startY: e.clientY, moved: false, pinch: null};
    else if (this.gesture && this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.gesture.moved = true;
      this.gesture.pinch = {distance: Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1, zoom: this.current.zoom};
    }
  };

  private readonly onPointerMove = (e: PointerEvent) => {
    const last = this.pointers.get(e.pointerId), gesture = this.gesture;
    if (!last || !gesture) return;
    const previous = [...this.pointers.values()];
    this.pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (gesture.pinch && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()], [pa, pb] = previous;
      const box = this.svg.getBoundingClientRect(), mid = [(a!.x + b!.x) / 2 - box.left, (a!.y + b!.y) / 2 - box.top] as const;
      const zoom = gesture.pinch.zoom * Math.hypot(a!.x - b!.x, a!.y - b!.y) / gesture.pinch.distance;
      const zoomed = zoomAt(this.current, zoom / this.current.zoom, mid[0], mid[1], this.world, this.viewport);
      this.set(panBy(zoomed, (a!.x + b!.x - pa!.x - pb!.x) / 2, (a!.y + b!.y - pa!.y - pb!.y) / 2, this.world, this.viewport));
      return;
    }
    if (!gesture.moved && Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY) > TAP_SLOP) {
      gesture.moved = true;
      this.svg.setPointerCapture?.(e.pointerId);
    }
    // At Fit a swipe has nothing to reveal: it neither pans nor taps.
    if (gesture.moved && this.current.zoom > 1) this.set(panBy(this.current, e.clientX - last.x, e.clientY - last.y, this.world, this.viewport));
  };

  private readonly onPointerUp = (e: PointerEvent) => {
    if (!this.pointers.delete(e.pointerId)) return;
    if (this.gesture?.moved) this.suppressClick = true;
    if (this.pointers.size === 0) this.gesture = null;
    else if (this.gesture) this.gesture.pinch = null;
  };

  /** A gesture's release never becomes a country action or a background deselect. */
  private readonly onClickCapture = (e: MouseEvent) => {
    if (!this.suppressClick) return;
    this.suppressClick = false;
    e.stopImmediatePropagation();
    e.preventDefault();
  };

  private readonly onWheel = (e: WheelEvent) => {
    // Ctrl+wheel is the browser's own zoom (and trackpad pinch); leave it alone.
    if (e.ctrlKey || e.metaKey || !e.deltaY) return;
    e.preventDefault();
    this.zoomBy(Math.exp(-clamp(e.deltaY, -100, 100) * 0.004), ...this.local(e));
  };

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const f = freeRect(this.viewport), cx = f.x + f.width / 2, cy = f.y + f.height / 2;
    const run = ({'+': () => this.zoomBy(1.5, cx, cy), '=': () => this.zoomBy(1.5, cx, cy), '-': () => this.zoomBy(1 / 1.5, cx, cy), '0': () => this.fit()} as Record<string, () => void>)[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  };

  /** Keyboard focus moving to a country off screen brings it into view. */
  private readonly onFocusIn = (e: FocusEvent) => {
    const country = (e.target as Element).closest?.<SVGGraphicsElement>('[data-country]');
    if (!country) return;
    this.lastFocused = country;
    if (this.current.zoom > 1 && this.viewport.width) this.set(revealCamera(this.current, this.bounds(country), this.world, this.viewport));
  };
}
