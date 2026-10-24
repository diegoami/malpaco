/** Display labels only. Stored card kinds and the rules that consume them stay unchanged. */
const labels:Readonly<Record<string,string>>={Anchor:'5 armies',Compass:'8 armies',Lantern:'15 armies',Surge:'Double armies',Raid:'Army reduction',Shield:'Protection',Wild:'Any value',Squall:'Cards lost'};
const faces:Readonly<Record<string,string>>={Anchor:'ARMIES',Compass:'ARMIES',Lantern:'ARMIES',Surge:'DOUBLE',Raid:'REDUCE',Shield:'PROTECT',Wild:'ANY',Squall:'CARDS LOST'};
export const cardLabel=(kind:string):string=>labels[kind]??kind;
export const cardFaceLabel=(kind:string):string=>faces[kind]??kind;
