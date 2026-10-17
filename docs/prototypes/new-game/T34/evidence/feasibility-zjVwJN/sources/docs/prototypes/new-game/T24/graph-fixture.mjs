// Parent-authored graph control. Geometry is deliberately absent: this is NOT
// a jointly valid geographic witness or a new production generator.
export function graphFixture() {
  const sizes = [3, 3, 3, 3, 5, 5, 7, 7, 10];
  const board = { provinces: [], islands: [], routes: [] };
  for (let i = 0; i < sizes.length; i++) {
    const island = { id: `i${i}`, provinces: [], bonus: 0 };
    for (let j = 0; j < sizes[i]; j++) {
      const id = `i${i}p${j}`; island.provinces.push(id);
      board.provinces.push({ id, island: island.id,
        borders: [`i${i}p${(j+1)%sizes[i]}`, `i${i}p${(j+sizes[i]-1)%sizes[i]}`], seaLanes: [] });
    }
    board.islands.push(island);
  }
  const pairs = [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[0,3],[3,6],[1,4],[4,7],[2,5],[5,8],
    [0,2],[2,8],[8,6],[6,0]];
  const used = sizes.map(() => 0);
  for (const [a,b] of pairs) {
    addSea(board, `i${a}p${used[a]++%2}`, `i${b}p${used[b]++%2}`);
  }
  refreshBonuses(board);
  return board;
}
export function addSea(board, a, b) {
  board.provinces.find(p=>p.id===a).seaLanes.push(b);
  board.provinces.find(p=>p.id===b).seaLanes.push(a);
  board.routes.push({ from: a, to: b });
}
export function removeSea(board, a, b) {
  board.provinces.find(p=>p.id===a).seaLanes = board.provinces.find(p=>p.id===a).seaLanes.filter(id=>id!==b);
  board.provinces.find(p=>p.id===b).seaLanes = board.provinces.find(p=>p.id===b).seaLanes.filter(id=>id!==a);
  board.routes = board.routes.filter(r=> !((r.from===a&&r.to===b)||(r.from===b&&r.to===a)));
}
export function refreshBonuses(board) {
  for (const i of board.islands) {
    const entrances = i.provinces.filter(id=>board.provinces.find(p=>p.id===id).seaLanes.length>0).length;
    i.bonus = Math.max(2, Math.floor(i.provinces.length/2)+entrances);
  }
}
